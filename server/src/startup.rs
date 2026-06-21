use anyhow::Result;
use std::net::TcpListener;
use tokio_util::sync::CancellationToken;

use crate::app::domains::document::models::Rooms;
use crate::app::redis::client::RedisClient;
use crate::core::app_data::AppData;
use crate::core::config_builder::AppConfig;
use crate::core::logger::{self, LogLevel};
use crate::core::server;
use crate::core::{pg_connector, redis_connector};

/// Запуск та ініціалізація бекенд-сервера Co-Write.
/// 
/// Налаштовує логування, підключається до бази даних PostgreSQL та пулу Redis,
/// створює спільний стан додатка (AppData) та запускає веб-сервер Actix-web.
pub async fn start() -> Result<()> {
    dotenvy::dotenv().ok();
    logger::init_logger(LogLevel::Info);

    let config = AppConfig::configure().unwrap();

    let db_pool = pg_connector::connect(config.postgres.options())
        .await
        .unwrap();

    let redis_pool = redis_connector::connect(&config.redis.addr())
        .await
        .unwrap();
    let redis_client = RedisClient::new(redis_pool);

    let lst = TcpListener::bind(config.app.addr()).unwrap();
    let cancel_token = CancellationToken::new();

    let app_data = AppData::builder()
        .with_pool(db_pool)
        .with_rooms(Rooms::default())
        .with_redis(redis_client)
        .with_redis_url(config.redis.addr())
        .with_cancel_token(cancel_token)
        .with_jwt_secret(config.jwt.secret)
        .build()
        .unwrap();

    let server = server::run(lst, app_data)?;
    server.await.map_err(Into::into)
}
