use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::core::app_error::{AppError, AppResult};

pub async fn establish_connection<S>(db_url: S) -> AppResult<PgPool>
where
    S: AsRef<str>,
{
    let max_connections = std::env::var("DB_MAX_CONN")
        .ok()
        .and_then(|val| val.parse().ok())
        .unwrap_or(5);

    let pool = PgPoolOptions::new()
        .max_connections(max_connections)
        .connect(db_url.as_ref())
        .await
        .map_err(AppError::from)?;

    let run_migrate: bool = std::env::var("MIGRATE_RUN")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);

    if run_migrate {
        tracing::info!("Running migrations...");
        let res_migrate = sqlx::migrate!("./migrations").run(&pool).await;

        match res_migrate {
            Ok(_) => tracing::info!("Migrations complete"),
            Err(err) => {
                tracing::error!("Migration failed: {}", &err);
                return Err(AppError::InternalServer(format!("Migration failed: {}", err)));
            }
        }
    }

    Ok(pool)
}
