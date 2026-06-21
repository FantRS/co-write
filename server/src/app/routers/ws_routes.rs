use actix_web::web::{self, ServiceConfig};

use crate::app::domains::document as doc_domain;


/// Налаштовує роути для веб-сокет з'єднань із документами.
pub fn cfg_ws(config: &mut ServiceConfig) {
    config.service(
        web::resource("/ws/{id}")
            .route(web::get().to(doc_domain::ws_handler))
    );
}
