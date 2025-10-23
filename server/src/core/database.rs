use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::core::app_error::{AppError, AppResult};

pub async fn establish_connection<S>(db_url: S) -> AppResult<PgPool>
where
    S: AsRef<str>,
{
    PgPoolOptions::new()
        .max_connections(5)
        .connect(db_url.as_ref())
        .await
        .map_err(AppError::from)
}
