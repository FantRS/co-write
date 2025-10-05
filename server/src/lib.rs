pub mod app_data;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};

use app_data::AppData;
use sqlx::{PgPool, postgres::PgPoolOptions};

pub async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let pool = establish_connection("").await?;
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

pub async fn establish_connection<S>(db_url: S) -> Result<PgPool, sqlx::Error>
where
    S: AsRef<str>,
{
    PgPoolOptions::new()
        .max_connections(5)
        .connect(db_url.as_ref())
        .await
}
