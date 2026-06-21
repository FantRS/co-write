use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::SaltString};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::rngs::OsRng;
use uuid::Uuid;

use super::models::{AuthResponse, Claims, LoginRequest, RegisterRequest};
use super::repository;
use crate::app::{RequestError, RequestResult, ServiceContext};

const TOKEN_EXPIRY_SECS: u64 = 7 * 24 * 3600; // 7 днів

/// Перевіряє, що ім'я користувача задовольняє мінімальні вимоги довжини.
pub(crate) fn validate_username(username: &str) -> RequestResult<()> {
    if username.is_empty() || username.len() < 3 {
        return Err(RequestError::bad_request("Ім'я користувача має бути не менше 3 символів"));
    }
    Ok(())
}

/// Перевіряє, що пароль задовольняє мінімальні вимоги довжини.
pub(crate) fn validate_password(password: &str) -> RequestResult<()> {
    if password.len() < 6 {
        return Err(RequestError::bad_request("Пароль має бути не менше 6 символів"));
    }
    Ok(())
}

/// Реєстрація нового користувача.
pub async fn register(
    req: RegisterRequest,
    jwt_secret: &str,
    ctx: &ServiceContext<'_>,
) -> RequestResult<AuthResponse> {
    let username = req.username.trim().to_string();

    validate_username(&username)?;
    validate_password(&req.password)?;

    // Перевіряємо унікальність username
    if repository::find_by_username(&username, ctx.db_pool).await?.is_some() {
        return Err(RequestError::conflict("Користувач із таким іменем вже існує"));
    }

    // Хешуємо пароль
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(req.password.as_bytes(), &salt)
        .map_err(|e| RequestError::internal_server_error(format!("Помилка хешування: {e}")))?
        .to_string();

    let user_id = repository::create_user(&username, &hash, ctx.db_pool).await?;

    let token = create_token(user_id, &username, jwt_secret)?;

    Ok(AuthResponse { token, username, user_id })
}

/// Вхід користувача.
pub async fn login(
    req: LoginRequest,
    jwt_secret: &str,
    ctx: &ServiceContext<'_>,
) -> RequestResult<AuthResponse> {
    let user = repository::find_by_username(&req.username, ctx.db_pool)
        .await?
        .ok_or_else(|| RequestError::unauthorized("Неправильне ім'я або пароль"))?;

    // Перевіряємо пароль
    let parsed = PasswordHash::new(&user.password_hash)
        .map_err(|e| RequestError::internal_server_error(format!("Помилка перевірки: {e}")))?;

    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed)
        .map_err(|_| RequestError::unauthorized("Неправильне ім'я або пароль"))?;

    let token = create_token(user.id, &user.username, jwt_secret)?;

    Ok(AuthResponse { token, username: user.username, user_id: user.id })
}

/// Валідує JWT та повертає claims.
pub fn validate_token(token: &str, jwt_secret: &str) -> RequestResult<Claims> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map(|d| d.claims)
    .map_err(|e| RequestError::unauthorized(format!("Невалідний токен: {e}")))
}

pub(crate) fn create_token(user_id: Uuid, username: &str, secret: &str) -> RequestResult<String> {
    let exp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() + TOKEN_EXPIRY_SECS;

    let claims = Claims {
        sub: user_id,
        username: username.to_string(),
        exp: exp as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| RequestError::internal_server_error(format!("Помилка генерації токена: {e}")))
}
