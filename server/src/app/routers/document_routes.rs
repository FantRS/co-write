use actix_web::web::{self, ServiceConfig};

use crate::app::controllers::document_controller as controller;

pub fn cfg_documents(config: &mut ServiceConfig) {
    config.service(
        web::scope("/documents")
            .route("/{id}", web::get().to(controller::get_document))
            .route("/create", web::post().to(controller::create_document)),
    );
}
