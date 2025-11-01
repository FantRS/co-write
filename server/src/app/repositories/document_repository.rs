use actix_web::web::Bytes;
use sqlx::PgExecutor;
use uuid::Uuid;

use crate::{app::models::change::ChangeData, core::app_error::AppResult};

pub async fn create<'c, S, I, E>(title: S, content: I, executor: E) -> AppResult<Uuid>
where
    S: AsRef<str>,
    I: IntoIterator<Item = u8>,
    E: PgExecutor<'c>,
{
    let id = sqlx::query_scalar!(
        "INSERT INTO documents (title, content) 
            VALUES ($1, $2) 
            RETURNING id",
        title.as_ref(),
        content.into_iter().collect::<Vec<u8>>()
    )
    .fetch_one(executor)
    .await?;

    Ok(id)
}

pub async fn read<'c, E>(id: Uuid, executor: E) -> AppResult<Vec<u8>>
where
    E: PgExecutor<'c>,
{
    let content = sqlx::query_scalar!(
        "SELECT content 
            FROM documents 
            WHERE id = $1
            ORDER BY id ASC",
        id
    )
    .fetch_one(executor)
    .await?;

    Ok(content)
}

pub async fn get_title<'c, E>(id: Uuid, executor: E) -> AppResult<String>
where
    E: PgExecutor<'c>,
{
    let title = sqlx::query_scalar!(
        "SELECT title 
            FROM documents 
            WHERE id = $1",
        id
    )
    .fetch_one(executor)
    .await?;

    Ok(title)
}

pub async fn update<'c, I, E>(id: Uuid, content: I, executor: E) -> AppResult<()>
where
    I: IntoIterator<Item = u8>,
    E: PgExecutor<'c>,
{
    sqlx::query!(
        "UPDATE documents
        SET 
            content = $2,
            updated_at = NOW()
        WHERE id = $1",
        id,
        content.into_iter().collect::<Vec<u8>>(),
    )
    .execute(executor)
    .await?;

    Ok(())
}

pub async fn delete<'c, I, E>(ids: I, executor: E) -> AppResult<()>
where
    I: IntoIterator<Item = Uuid>,
    E: PgExecutor<'c>,
{
    sqlx::query!(
        "DELETE FROM document_updates 
            WHERE id = ANY($1)",
        &ids.into_iter().collect::<Vec<Uuid>>(),
    )
    .execute(executor)
    .await?;

    Ok(())
}

pub async fn push_change_in_db<'c, E>(id: Uuid, change: Bytes, executor: E) -> AppResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query!(
        "INSERT INTO document_updates (document_id, update) 
            VALUES ($1, $2)",
        id,
        change.as_ref(),
    )
    .execute(executor)
    .await?;

    Ok(())
}

pub async fn get_change<'c, E>(id: Uuid, executor: E) -> AppResult<Vec<ChangeData>>
where
    E: PgExecutor<'c>,
{
    let res = sqlx::query_as!(
        ChangeData,
        "SELECT id, update 
            FROM document_updates 
            WHERE document_id = $1 
            ORDER BY created_at ASC",
        id,
    )
    .fetch_all(executor)
    .await?;

    Ok(res)
}
