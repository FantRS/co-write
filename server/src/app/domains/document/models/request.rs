use serde::{Deserialize, Serialize};

/// Модель запиту на створення нового документа.
#[derive(Serialize, Deserialize, utoipa::ToSchema)]
pub struct CreateDocumentRequest {
    pub title: String,
}
