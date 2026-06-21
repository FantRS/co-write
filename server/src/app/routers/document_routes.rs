use actix_web::web::{self, ServiceConfig};

use crate::app::domains::auth as auth_domain;
use crate::app::domains::document as doc_domain;
use crate::app::domains::execution as exec_domain;
use crate::app::domains::lsp as lsp_domain;

/// Налаштовує роути авторизації.
pub fn cfg_auth(config: &mut ServiceConfig) {
    config.service(
        web::scope("/auth")
            .route("/register", web::post().to(auth_domain::register))
            .route("/login",    web::post().to(auth_domain::login))
    );
}

/// Налаштовує роути для роботи з документами, виконання коду та LSP.
pub fn cfg_documents(config: &mut ServiceConfig) {
    config.service(
        web::scope("/documents")
            .route("",                               web::get().to(doc_domain::list_documents))
            .route("/create",                        web::post().to(doc_domain::create_document))
            .route("/{id}",                          web::get().to(doc_domain::get_document))
            .route("/{id}/title",                    web::get().to(doc_domain::get_document_title))
            .route("/{id}/execute",                  web::post().to(exec_domain::execute_code))
            .route("/{id}/test",                     web::post().to(exec_domain::execute_tests))
            .route("/{id}/format",                   web::post().to(exec_domain::format_code))
            .route("/{id}/complete",                 web::post().to(lsp_domain::complete))
            .route("/{id}/hover",                    web::post().to(lsp_domain::hover))
            .route("/{id}/members",                  web::post().to(doc_domain::add_member))
            .route("/{id}/members/{uid}",            web::delete().to(doc_domain::remove_member))
            .route("/{id}/participants",             web::get().to(doc_domain::get_participants))
            .route("/{id}/export",                   web::post().to(doc_domain::export_project))
    );
}
