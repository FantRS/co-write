use std::net::TcpListener;
use std::str::FromStr;
use sqlx::{PgPool, postgres::PgConnectOptions};
use tokio_util::sync::CancellationToken;

use server::AppData;
use server::app::domains::document::models::Rooms;
use server::app::redis::client::RedisClient;

#[allow(dead_code)]
pub struct TestApp {
    pub address: String,
    pub db_pool: PgPool,
    pub redis: RedisClient,
}

#[allow(dead_code)]
pub async fn spawn_app() -> Option<TestApp> {
    dotenvy::dotenv().ok();

    let listener = TcpListener::bind("127.0.0.1:0").ok()?;
    let port = listener.local_addr().unwrap().port();
    let address = format!("http://127.0.0.1:{}", port);

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://cowrite_user:cowrite_pass@127.0.0.1:5432/cowrite_db".to_string());

    unsafe { std::env::set_var("MIGRATE_RUN", "true"); }
    let options = PgConnectOptions::from_str(&database_url).ok()?;
    let db_pool = server::core::pg_connector::connect(options).await.ok()?;

    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

    let redis_pool = server::core::redis_connector::connect(&redis_url).await.ok()?;
    let redis_client = RedisClient::new(redis_pool);

    let app_data = AppData::builder()
        .with_pool(db_pool.clone())
        .with_rooms(Rooms::default())
        .with_redis(redis_client.clone())
        .with_redis_url(redis_url)
        .with_cancel_token(CancellationToken::new())
        .with_jwt_secret("test-jwt-secret-key-1234567890".to_string())
        .build()
        .ok()?;

    let server = server::core::server::run(listener, app_data).ok()?;
    let _ = tokio::spawn(server);

    Some(TestApp {
        address,
        db_pool,
        redis: redis_client,
    })
}
