use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Користувач системи.
#[derive(sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub password_hash: String,
}

/// Запит на реєстрацію.
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

/// Запит на вхід.
#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// Відповідь із JWT-токеном після успішної авторизації.
#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub username: String,
    pub user_id: Uuid,
}

/// JWT claims.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,       // user_id
    pub username: String,
    pub exp: usize,      // expiration timestamp (Unix)
}
