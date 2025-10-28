use actix_web::web::Bytes;
use actix_ws::Session;
use automerge::{AutoCommit, Change};
use sqlx::PgPool;
use std::time::Duration;
use tokio::time::sleep;
use uuid::Uuid;

use crate::{
    app::{models::change::ChangeData, repositories::document_repository},
    core::{app_data::AppData, app_error::{AppError, AppResult}},
};

fn create_empty_document() -> Vec<u8> {
    let mut doc = AutoCommit::new();

    AutoCommit::save(&mut doc)
}

pub async fn create_document<S>(title: S, pool: &PgPool) -> AppResult<Uuid>
where
    S: AsRef<str>,
{
    let content = create_empty_document();
    let resp = document_repository::create(title, content, pool).await?;

    Ok(resp)
}

pub async fn read_document(id: Uuid, pool: &PgPool) -> AppResult<Vec<u8>> {
    let resp = document_repository::read(id, pool).await?;

    Ok(resp)
}

pub async fn push_change(doc_id: Uuid, conn_id: Uuid, change: Bytes, app_data: &AppData) {
    if let Err(err) =
        document_repository::push_change_in_db(doc_id, change.clone(), &app_data.pool).await
    {
        tracing::error!("{err}")
    } else {
        tracing::info!("user changes added");

        app_data.rooms.send_change(&doc_id, conn_id, change).await;
    }
}

pub async fn send_existing_changes(
    pool: &PgPool,
    session: &mut Session,
    doc_id: Uuid,
) -> AppResult<()> {
    let changes = document_repository::get_change(doc_id, pool).await?;

    for change in changes {
        session.binary(Bytes::from(change.update)).await?;
    }

    Ok(())
}

pub async fn run_merge_deamon(app_data: &AppData, id: Uuid) {
    let cancel_token = app_data.token().child_token();
    let (pool, rooms) = app_data.get_data();
    let interval = Duration::from_secs(300);

    tokio::spawn(async move {
        tracing::info!("Started merge deamon for {id}");

        loop {
            tokio::select! {
                _ = cancel_token.cancelled() => {
                    tracing::info!("Stoping merge deamon for {id} (canceled)");
                    break;
                }
                _ = sleep(interval) => {
                    if rooms.value.get(&id).is_none() {
                        tracing::info!("Stoping merge deamon for {id}");
                        break;
                    }

                    if let Err(err) = merge_changes(&pool, id).await {
                        tracing::error!("Merge error for {id}: {err:?}");
                    }
                }
            }
        }
    });
}

pub async fn merge_changes(pool: &PgPool, doc_id: Uuid) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    let doc_bytes = document_repository::read(doc_id, pool).await?;
    let mut doc = AutoCommit::load(&doc_bytes)?;

    let changes_data = document_repository::get_change(doc_id, pool).await?;
    if changes_data.is_empty() {
        tracing::debug!("No new changes for {doc_id}");

        tx.commit().await?;
        return Ok(());
    }

    let (ids, changes_bytes) = ChangeData::split_data(changes_data);
    let changes: Vec<Change> = changes_bytes
        .into_iter()
        .map(|change| {
            Change::from_bytes(change)
                .map_err(|e| AppError::InternalServer(format!("Failed deserialize change: {e}")))
        })
        .collect::<AppResult<Vec<_>>>()?;

    for change in changes {
        doc.apply_changes(vec![change])?;
    }

    document_repository::update(doc_id, doc.save(), &mut *tx).await?;
    document_repository::delete(ids, &mut *tx).await?;

    tx.commit().await?;
    Ok(())
}
