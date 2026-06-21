use deadpool_redis::redis::AsyncCommands as _;
use deadpool_redis::redis::FromRedisValue;
use deadpool_redis::redis::Pipeline;
use deadpool_redis::Connection;
use deadpool_redis::Pool as RedisPool;

use crate::app::{RequestError, RequestResult};

/// Обгортка над пулом підключень Redis із допоміжними методами для Co-Write.
#[derive(Clone)]
pub struct RedisClient {
    pool: RedisPool,
}

impl RedisClient {
    /// Створює новий екземпляр RedisClient.
    pub fn new(pool: RedisPool) -> Self {
        Self { pool }
    }

    /// Отримує активне підключення з пулу Redis.
    async fn conn(&self) -> RequestResult<Connection> {
        self.pool.get().await.map_err(|e| {
            RequestError::internal_server_error(format!("Помилка підключення до Redis: {}", e))
        })
    }

    /// Отримує рядкове значення за ключем.
    pub async fn get(&self, key: &str) -> RequestResult<Option<String>> {
        let mut conn = self.conn().await?;
        conn.get(key)
            .await
            .map_err(|e| RequestError::internal_server_error(format!("Помилка Redis GET: {}", e)))
    }

    /// Встановлює рядкове значення за ключем.
    pub async fn set(&self, key: &str, value: &str) -> RequestResult<()> {
        let mut conn = self.conn().await?;
        conn.set(key, value)
            .await
            .map_err(|e| RequestError::internal_server_error(format!("Помилка Redis SET: {}", e)))
    }

    /// Встановлює рядкове значення за ключем із заданим часом життя (TTL) у секундах.
    pub async fn set_ex(&self, key: &str, value: &str, ttl: u64) -> RequestResult<()> {
        let mut conn = self.conn().await?;
        conn.set_ex(key, value, ttl)
            .await
            .map_err(|e| RequestError::internal_server_error(format!("Помилка Redis SET_EX: {}", e)))
    }

    /// Видаляє ключ із Redis.
    pub async fn del(&self, key: &str) -> RequestResult<()> {
        let mut conn = self.conn().await?;
        conn.del(key)
            .await
            .map_err(|e| RequestError::internal_server_error(format!("Помилка Redis DEL: {}", e)))
    }

    /// Повертає новий конвеєр (pipeline) команд Redis.
    pub fn get_pipe(&self) -> Pipeline {
        deadpool_redis::redis::pipe()
    }

    /// Виконує конвеєр команд.
    pub async fn exec_pipe<T: FromRedisValue>(&self, pipeline: &Pipeline) -> RequestResult<T> {
        let mut conn = self.conn().await?;
        pipeline.query_async(&mut conn).await.map_err(|e| {
            RequestError::internal_server_error(format!("Помилка виконання конвеєра Redis Pipeline: {}", e))
        })
    }

    /// Публікує бінарне повідомлення в Redis Pub/Sub канал.
    pub async fn publish(&self, channel: &str, payload: Vec<u8>) -> RequestResult<()> {
        let mut conn = self.conn().await?;
        conn.publish(channel, payload)
            .await
            .map_err(|e| RequestError::internal_server_error(format!("Помилка Redis PUBLISH: {}", e)))
    }
}
