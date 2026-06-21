use sqlx::PgPool;
use tokio_util::sync::CancellationToken;
use anyhow::{Error, Result};

use crate::{
    app::domains::document::models::Rooms,
    app::domains::lsp::LspManager,
    app::redis::client::RedisClient,
};

/// Спільний стан додатка, доступний усім обробникам запитів.
#[derive(Clone)]
pub struct AppData {
    pub pool: PgPool,
    pub rooms: Rooms,
    pub redis: RedisClient,
    pub redis_url: String,
    pub cancel_token: CancellationToken,
    pub lsp: LspManager,
    pub jwt_secret: String,
}

impl AppData {
    /// Повертає новий будівельник (builder) для AppData.
    pub fn builder() -> AppDataBuilder {
        AppDataBuilder::default()
    }

    /// Отримує копію пулу підключень бази даних та кімнат.
    pub fn get_data(&self) -> (PgPool, Rooms) {
        let pool = self.pool.clone();
        let rooms = self.rooms.clone();
        (pool, rooms)
    }

    /// Повертає токен скасування фонових завдань.
    pub fn token(&self) -> CancellationToken {
        self.cancel_token.clone()
    }
}

/// Будівельник для створення екземпляра AppData.
#[derive(Default)]
pub struct AppDataBuilder {
    pool: Option<PgPool>,
    rooms: Option<Rooms>,
    redis: Option<RedisClient>,
    redis_url: Option<String>,
    cancel_token: Option<CancellationToken>,
    jwt_secret: Option<String>,
}

impl AppDataBuilder {
    /// Будує AppData, повертаючи помилку, якщо якесь із обов'язкових полів не задано.
    pub fn build(self) -> Result<AppData> {
        let lsp = LspManager::default();
        lsp.start_cleanup_task();

        let app_data = AppData {
            pool: self
                .pool
                .ok_or_else(|| Error::msg("Помилка створення AppData (відсутній pool)"))?,
            rooms: self
                .rooms
                .ok_or_else(|| Error::msg("Помилка створення AppData (відсутні rooms)"))?,
            redis: self
                .redis
                .ok_or_else(|| Error::msg("Помилка створення AppData (відсутній redis)"))?,
            redis_url: self
                .redis_url
                .ok_or_else(|| Error::msg("Помилка створення AppData (відсутній redis_url)"))?,
            cancel_token: self
                .cancel_token
                .ok_or_else(|| Error::msg("Помилка створення AppData (відсутній cancel_token)"))?,
            jwt_secret: self
                .jwt_secret
                .ok_or_else(|| Error::msg("Помилка створення AppData (відсутній jwt_secret)"))?,
            lsp,
        };

        Ok(app_data)
    }

    /// Додає пул підключень PostgreSQL.
    pub fn with_pool(mut self, pool: PgPool) -> Self {
        self.pool = Some(pool);
        self
    }

    /// Додає структуру кімнат веб-сокетів.
    pub fn with_rooms(mut self, rooms: Rooms) -> Self {
        self.rooms = Some(rooms);
        self
    }

    /// Додає клієнт Redis.
    pub fn with_redis(mut self, redis: RedisClient) -> Self {
        self.redis = Some(redis);
        self
    }

    /// Додає URL-адресу Redis.
    pub fn with_redis_url(mut self, redis_url: String) -> Self {
        self.redis_url = Some(redis_url);
        self
    }

    /// Додає токен скасування.
    pub fn with_cancel_token(mut self, cancel_token: CancellationToken) -> Self {
        self.cancel_token = Some(cancel_token);
        self
    }

    /// Додає секрет JWT.
    pub fn with_jwt_secret(mut self, jwt_secret: String) -> Self {
        self.jwt_secret = Some(jwt_secret);
        self
    }
}
