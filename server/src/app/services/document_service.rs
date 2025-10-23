use sqlx::PgPool;
use automerge::AutoCommit;
use uuid::Uuid;

use crate::{
    core::app_error::AppResult,
    app::repositories::document_repository,
};

fn create_empty_document() -> Vec<u8> {
    let mut doc = AutoCommit::new();

    let bytes = automerge::AutoCommit::save(&mut doc);

    bytes
}

pub async fn create_document<S>(title: S, pool: &PgPool) -> AppResult<Uuid> 
where S: AsRef<str>,
{
    let content = create_empty_document();
    let resp = document_repository::create(title, content, pool).await?;

    Ok(resp)
}

pub async fn read_document<S>(id: S, pool: &PgPool) -> AppResult<Vec<u8>> 
where S: AsRef<str>,
{
    let id = Uuid::parse_str(id.as_ref())?;
    let resp = document_repository::read(id, pool).await?;

    Ok(resp)
}
