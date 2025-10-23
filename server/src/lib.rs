pub mod app;
pub mod core;
pub mod extensions;
pub mod ws;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use std::net::TcpListener;

use app::controllers::document_controller;
use core::{app_data::AppData, app_error::AppResult};

pub async fn run(lst: TcpListener, app_data: AppData) -> AppResult<()> {
    HttpServer::new(move || {
        App::new()
            .wrap(Cors::default().allow_any_origin())
            .service(
                web::scope("documents")
                    .route(
                        "/create",
                        web::post().to(document_controller::create_document),
                    )
                    .route("/{id}", web::get().to(document_controller::get_document)),
            )
            .route("/ws", web::get().to(ws::ws_handler))
            .app_data(web::Data::new(app_data.clone()))
    })
    .listen(lst)?
    .run()
    .await?;

    Ok(())
}
