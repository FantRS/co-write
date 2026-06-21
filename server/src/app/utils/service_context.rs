use sqlx::PgPool;
use crate::app::redis::client::RedisClient;
use crate::AppData;

/// Контекст сервісу, що містить посилання на пул підключень до бази даних, клієнт Redis та кімнати.
pub struct ServiceContext<'a> {
    pub db_pool: &'a PgPool,
    pub redis: &'a RedisClient,
    pub rooms: &'a crate::app::domains::document::models::Rooms,
}

impl<'a> From<&'a AppData> for ServiceContext<'a> {
    /// Створює ServiceContext із посиланням на AppData.
    fn from(value: &'a AppData) -> Self {
        Self {
            db_pool: &value.pool,
            redis: &value.redis,
            rooms: &value.rooms,
        }
    }
}
