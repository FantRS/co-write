pub mod app;
pub mod core;
pub mod extensions;
pub mod telemetry;
pub mod ws;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use std::net::TcpListener;
use tracing_actix_web::TracingLogger;

use app::controllers::document_controller;
use core::{app_data::AppData, app_error::AppResult};

use crate::app::models::ws_rooms::Rooms;

pub async fn run(lst: TcpListener, app_data: AppData, rooms: Rooms) -> AppResult<()> {
    HttpServer::new(move || {
        App::new()
            .wrap(TracingLogger::default())
            .wrap(Cors::default().allow_any_origin())
            .service(
                web::scope("/documents")
                    .route(
                        "/create",
                        web::post().to(document_controller::create_document),
                    )
                    .route("/{id}", web::get().to(document_controller::get_document)),
            )
            .route("/ws/{id}", web::get().to(ws::ws_handler))
            .app_data(web::Data::new(app_data.clone()))
            .app_data(web::Data::new(rooms.clone()))
    })
    .listen(lst)?
    .run()
    .await?;

    Ok(())
}
