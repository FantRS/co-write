pub mod app;
pub mod app_data;
pub mod app_error;
pub mod extensions;
pub mod ws;

use ws::ws_handler;
use std::net::TcpListener;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use sqlx::{PgPool, postgres::PgPoolOptions};

use app_data::AppData;
use app_error::{AppError, AppResult};
use app::controllers::{document_controller};

pub async fn run(lst: TcpListener) -> AppResult<()> {
    let database_url = std::env::var("DATABASE_URL")?;

    let pool = establish_connection(database_url).await?;
    let app_data = AppData { pool };

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::default().allow_any_origin())
            .service(web::scope("documents")
                .route("/create", web::post().to(document_controller::create_document))
                .route("/{id}", web::get().to(document_controller::get_document))
            )  
            .route("/ws", web::get().to(ws_handler))
            .app_data(web::Data::new(app_data.clone()))
    })
    .listen(lst)?
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
