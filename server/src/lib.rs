pub mod api_doc;
pub mod app;
pub mod core;
pub mod extensions;
pub mod telemetry;

use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use std::net::TcpListener;
use tracing_actix_web::TracingLogger;

use app::routers::{docs_routes, document_routes, ws_routes};
use core::{app_data::AppData, app_error::AppResult};

pub async fn run(lst: TcpListener, app_data: AppData) -> AppResult<()> {
    HttpServer::new(move || {
        App::new()
            .wrap(TracingLogger::default())
            .wrap(Cors::default().allow_any_origin())
            .app_data(web::Data::new(app_data.clone()))
            .configure(docs_routes::swagger_ui)
            .service(
                web::scope("/api")
                    .configure(document_routes::cfg_documents)
                    .configure(ws_routes::cfg_ws),
            )
    })
    .listen(lst)?
    .run()
    .await?;

    Ok(())
}
