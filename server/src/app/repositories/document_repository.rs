use sqlx::{PgExecutor, Row};
use uuid::Uuid;

use crate::{core::app_error::AppResult};

pub async fn create<'c, S, E>(title: S, content: Vec<u8>, executor: E) -> AppResult<Uuid>
where 
    S: AsRef<str>,
    E: PgExecutor<'c>,
{
    let row = sqlx::query(
        "INSERT INTO documents (title, content) 
        VALUES ($1, $2) 
        RETURNING id"
    )
    .bind(title.as_ref())
    .bind(content)
    .fetch_one(executor)
    .await?;

    let id: Uuid = row.get("id");

    Ok(id)
}

pub async fn read<'c, E>(id: Uuid, executor: E) -> AppResult<Vec<u8>> 
where 
    E: PgExecutor<'c>,
{
    // let uuid = Uuid::parse_str(id.as_ref())?;

    let row = sqlx::query(
        "SELECT content 
        FROM documents 
        WHERE id = $1"
    )
    .bind(id)
    .fetch_one(executor)
    .await?;

    let content = row.get("content");

    Ok(content)
}
