use uuid::Uuid;
use super::rows::DocumentRow;

/// Модель відповіді з даними документа.
#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct DocumentResponse {
    pub id: Uuid,
    pub title: String,
    pub content: Vec<u8>,
}

impl From<DocumentRow> for DocumentResponse {
    /// Конвертує модель рядка бази даних DocumentRow у модель відповіді DocumentResponse.
    fn from(row: DocumentRow) -> Self {
        Self {
            id: row.id,
            title: row.title,
            content: row.content,
        }
    }
}
