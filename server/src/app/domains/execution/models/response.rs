use serde::{Deserialize, Serialize};

/// Модель відповіді з результатом виконання коду в пісочниці.
#[derive(Serialize, Deserialize, utoipa::ToSchema)]
pub struct ExecutionResponse {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}
