use actix_web::web::Bytes;
use actix_ws::Session;
use automerge::AutoCommit;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    app::repositories::document_repository::{self, get_change},
    core::{app_data::AppData, app_error::AppResult},
};

fn create_empty_document() -> Vec<u8> {
    let mut doc = AutoCommit::new();

    automerge::AutoCommit::save(&mut doc)
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
    let changes = get_change(doc_id, pool).await?;

    for change in changes {
        session.binary(Bytes::from(change)).await?;
    }

    Ok(())
}
