use utoipa::OpenApi;

use crate::app::controllers::{document_controller, ws_controller};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Co-Write", 
        description = "Co-Write API documentation", version = "0.1"
    ),
    paths(
        // /api/documents
        document_controller::create_document,
        document_controller::get_document,

        // /ws
        ws_controller::ws_handler
    ),
)]
pub struct ApiDoc;
