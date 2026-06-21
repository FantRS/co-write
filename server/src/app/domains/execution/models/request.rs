use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Модель запиту на виконання багатофайлового проекту.
#[derive(Serialize, Deserialize, utoipa::ToSchema)]
pub struct ExecuteProjectRequest {
    /// Карта відносних шляхів файлів до їх текстового вмісту (наприклад, {"src/main.rs": "..."}).
    pub files: HashMap<String, String>,
}
