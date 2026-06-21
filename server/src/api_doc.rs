use utoipa::OpenApi;

use crate::app::domains::document;
use crate::app::domains::execution;
use crate::app::domains::lsp;


/// Структура генерації специфікації OpenAPI для документації API Co-Write.
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Co-Write", 
        description = "Документація API Co-Write", version = "0.1"
    ),
    paths(
        // /api/documents
        document::controller::create_document,
        document::controller::get_document,
        document::controller::get_document_title,
        execution::controller::execute_code,
        execution::controller::execute_tests,
        execution::controller::format_code,
        lsp::controller::complete,
        lsp::controller::hover,

        // /ws
        document::ws_handler::ws_handler
    ),
    components(
        schemas(
            execution::models::ExecutionResponse
        )
    )
)]
pub struct ApiDoc;
