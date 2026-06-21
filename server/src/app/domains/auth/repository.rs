use sqlx::PgPool;
use uuid::Uuid;

use super::models::User;
use crate::app::RequestResult;

/// Створює нового користувача у базі даних.
pub async fn create_user(username: &str, password_hash: &str, pool: &PgPool) -> RequestResult<Uuid> {
    let id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id"
    )
    .bind(username)
    .bind(password_hash)
    .fetch_one(pool)
    .await?;

    Ok(id)
}

/// Знаходить користувача за іменем.
pub async fn find_by_username(username: &str, pool: &PgPool) -> RequestResult<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash FROM users WHERE username = $1"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

/// Знаходить користувача за UUID.
pub async fn find_by_id(id: Uuid, pool: &PgPool) -> RequestResult<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash FROM users WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}
