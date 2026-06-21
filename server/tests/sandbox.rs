mod common;

use std::collections::HashMap;
use server::app::domains::execution::service::execute_rust_code;
use server::app::domains::document::models::Rooms;
use server::app::redis::client::RedisClient;
use server::app::utils::service_context::ServiceContext;

fn make_dummy_context() -> (sqlx::PgPool, RedisClient, Rooms) {
    let db_pool = sqlx::PgPool::connect_lazy("postgres://localhost/db").unwrap();
    let cfg = deadpool_redis::Config::from_url("redis://127.0.0.1:6379");
    let redis_pool = cfg.create_pool(Some(deadpool_redis::Runtime::Tokio1)).unwrap();
    let redis_client = RedisClient::new(redis_pool);
    let rooms = Rooms::default();
    (db_pool, redis_client, rooms)
}

#[tokio::test]
async fn test_sandbox_normal_code() {
    let (pool, redis, rooms) = make_dummy_context();
    let ctx = ServiceContext {
        db_pool: &pool,
        redis: &redis,
        rooms: &rooms,
    };

    let mut files = HashMap::new();
    files.insert("main.rs".to_string(), r#"
        fn main() {
            println!("Hello from the sandbox!");
        }
    "#.to_string());

    let result = execute_rust_code(&files, &ctx).await.unwrap();
    assert!(result.success, "Нормальний код повинен виконатися успішно");
    assert!(result.stdout.contains("Hello from the sandbox!"), "Вивід повинен містити очікуваний текст");
    assert!(result.stderr.is_empty(), "Помилок бути не повинно");
}

#[tokio::test]
async fn test_sandbox_infinite_loop_timeout() {
    let (pool, redis, rooms) = make_dummy_context();
    let ctx = ServiceContext {
        db_pool: &pool,
        redis: &redis,
        rooms: &rooms,
    };

    let mut files = HashMap::new();
    files.insert("main.rs".to_string(), r#"
        fn main() {
            loop {}
        }
    "#.to_string());

    let result = execute_rust_code(&files, &ctx).await.unwrap();
    assert!(!result.success, "Код із нескінченним циклом повинен завершитися неуспішно (бути примусово зупиненим)");
    if !result.stderr.is_empty() {
        assert!(result.stderr.contains("Перевищено ліміт часу виконання"), "Помилка має вказувати на перевищення ліміту часу");
    }
}

#[tokio::test]
async fn test_sandbox_syntax_error() {
    let (pool, redis, rooms) = make_dummy_context();
    let ctx = ServiceContext {
        db_pool: &pool,
        redis: &redis,
        rooms: &rooms,
    };

    let mut files = HashMap::new();
    files.insert("main.rs".to_string(), r#"
        fn main() {
            invalid_rust_code_here!!!
        }
    "#.to_string());

    let result = execute_rust_code(&files, &ctx).await.unwrap();
    assert!(!result.success, "Код із синтаксичною помилкою не повинен скомпілюватися");
    assert!(!result.stderr.is_empty(), "Має бути виведений опис помилок компіляції");
}

#[tokio::test]
async fn test_sandbox_memory_exhaustion() {
    let (pool, redis, rooms) = make_dummy_context();
    let ctx = ServiceContext {
        db_pool: &pool,
        redis: &redis,
        rooms: &rooms,
    };

    let mut files = HashMap::new();
    files.insert("main.rs".to_string(), r#"
        fn main() {
            let mut v = Vec::with_capacity(500 * 1024 * 1024);
            v.push(1u8);
            println!("Allocated successfully: {}", v.len());
        }
    "#.to_string());

    let result = execute_rust_code(&files, &ctx).await.unwrap();
    if !result.success {
        assert!(result.stdout.is_empty(), "Не повинно бути успішного виводу при перевищенні пам'яті");
    }
}
