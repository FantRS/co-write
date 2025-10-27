use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::core::app_error::{AppError, AppResult};

pub async fn establish_connection<S>(db_url: S) -> AppResult<PgPool>
where
    S: AsRef<str>,
{
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(db_url.as_ref())
        .await
        .map_err(AppError::from)?;

    let run_migrate: bool = std::env::var("MIGRATE_RUN")
        .unwrap_or("false".into())
        .parse()
        .expect("RUN_MIGRATE ENV error");

    if run_migrate {
        tracing::info!("Running migrations...");
        if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
            tracing::error!("Migration failed: {}", e);
        } else {
            tracing::info!("Migrations complete");
        };
    }

    Ok(pool)
}
