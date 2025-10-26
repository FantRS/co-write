use actix_web::web::Bytes;
use automerge::AutoCommit;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    app::repositories::document_repository,
    core::{app_data::AppData, app_error::AppResult},
};

fn create_empty_document() -> Vec<u8> {
    let mut doc = AutoCommit::new();

    let bytes = automerge::AutoCommit::save(&mut doc);

    bytes
}

pub async fn create_document<S>(title: S, pool: &PgPool) -> AppResult<Uuid>
where
    S: AsRef<str>,
{
    let content = create_empty_document();
    let resp = document_repository::create(title, content, pool).await?;

    Ok(resp)
}

pub async fn read_document<S>(id: S, pool: &PgPool) -> AppResult<Vec<u8>>
where
    S: AsRef<str>,
{
    let id = Uuid::parse_str(id.as_ref())?;
    let resp = document_repository::read(id, pool).await?;

    Ok(resp)
}

pub async fn push_change(doc_id: Uuid, conn_id: Uuid, change: Bytes, app_data: &AppData) {
    if let Err(err) =
        document_repository::push_change_in_db(doc_id.clone(), change.clone(), &app_data.pool).await
    {
        tracing::error!("{err}")
    } else {
        tracing::info!("user changes added");

        app_data.rooms.send_change(&doc_id, conn_id, change).await;
    }
}
