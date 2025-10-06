pub mod app;
pub mod app_data;
pub mod app_error;
pub mod extensions;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use sqlx::{PgPool, postgres::PgPoolOptions};

use app_data::AppData;
use app_error::{AppError, AppResult};

pub async fn run() -> AppResult<()> {
    let database_url = std::env::var("DATABASE_URL")?;

    let pool = establish_connection(database_url).await?;
    let app_data = AppData { pool };

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .app_data(web::Data::new(app_data.clone()))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await?;

    Ok(())
}

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
