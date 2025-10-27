use actix_web::web::{self, ServiceConfig};

use crate::app::controllers::ws_controller as controller;

pub fn cfg_ws(config: &mut ServiceConfig) {
    config.service(
        web::resource("/ws/{id}")
            .route(web::get().to(controller::ws_handler))
    );
}
