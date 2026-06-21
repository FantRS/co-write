use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use anyhow::Result;
use std::{net::TcpListener, time::Duration};
use tracing_actix_web::TracingLogger;

use crate::app::routers::{docs_routes, document_routes, ws_routes};
use crate::core::app_data::AppData;

/// Запускає веб-сервер Actix-web на вказаному TcpListener із переданим AppData.
pub fn run(lst: TcpListener, app_data: AppData) -> Result<actix_web::dev::Server, std::io::Error> {
    let addr = lst.local_addr()?;
    tracing::info!("Адреса сервера: http://{}", addr);

    let server = HttpServer::new(move || {
        App::new()
            .wrap(configure_cors())
            .wrap(TracingLogger::default())
            .app_data(web::Data::new(app_data.clone()))
            .configure(docs_routes::swagger_ui)
            .service(
                web::scope("/api")
                    .configure(document_routes::cfg_auth)
                    .configure(document_routes::cfg_documents)
                    .configure(ws_routes::cfg_ws),
            )
    })
    .keep_alive(Duration::from_secs(75))
    .listen(lst)?
    .run();

    Ok(server)
}

/// Налаштовує параметри CORS (Cross-Origin Resource Sharing), дозволяючи будь-які запити (для розробки).
fn configure_cors() -> Cors {
    Cors::default()
        .allow_any_origin()
        .allow_any_method()
        .allow_any_header()
        .max_age(3600)
}
