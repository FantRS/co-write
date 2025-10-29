use sqlx::{
    PgPool,
    postgres::{PgConnectOptions, PgPoolOptions},
};

use crate::core::app_error::{AppError, AppResult};

pub async fn connect(db_conn: PgConnectOptions) -> AppResult<PgPool> {
    let max_conn = std::env::var("DB_MAX_CONN")
        .ok()
        .and_then(|val| val.parse().ok())
        .unwrap_or(5);

    let pool = PgPoolOptions::new()
        .max_connections(max_conn)
        .connect_with(db_conn)
        .await
        .map_err(AppError::from)?;

    let is_run_migrate: bool = std::env::var("MIGRATE_RUN")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);

    if is_run_migrate {
        tracing::info!("Running migrations...");
        let migrate_res = sqlx::migrate!("./migrations").run(&pool).await;

        match migrate_res {
            Ok(_) => tracing::info!("Migrations complete"),
            Err(err) => {
                tracing::error!("Migration failed: {}", &err);
                return Err(AppError::InternalServer(format!(
                    "Migration failed: {}",
                    err
                )));
            }
        }
    }

    Ok(pool)
}
