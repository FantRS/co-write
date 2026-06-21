use std::time::Duration;
use anyhow::{Context, Result};
use sqlx::{
    PgPool,
    postgres::{PgConnectOptions, PgPoolOptions},
};

pub async fn connect(options: PgConnectOptions) -> Result<PgPool> {
    tracing::info!("встановлення з'єднання з базою даних");

    let max_conn = std::env::var("DB_MAX_CONN")
        .ok()
        .and_then(|val| val.parse().ok())
        .unwrap_or(5);

    let pool = PgPoolOptions::new()
        .max_connections(max_conn)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .connect_with(options)
        .await
        .context("Не вдалося підключитися до пулу PostgreSQL")?;

    tracing::info!("пул підключень успішно створено");

    let is_run_migrate: bool = std::env::var("MIGRATE_RUN")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);

    if is_run_migrate {
        tracing::info!("Запуск міграцій...");
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .context("Не вдалося запустити міграції")?;
        tracing::info!("Міграції завершено успішно");
    }

    Ok(pool)
}
