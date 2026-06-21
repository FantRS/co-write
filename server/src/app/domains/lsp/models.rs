use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::session::LspCompletionItem;

/// Запит автодоповнення: файли проекту + позиція курсора.
#[derive(Deserialize, ToSchema)]
pub struct CompletionRequest {
    /// Карта файлів проекту: { "src/main.rs": "...", "src/lib.rs": "..." }
    pub files: HashMap<String, String>,
    /// Відносний шлях до файлу, де знаходиться курсор (наприклад "src/main.rs")
    pub file_path: String,
    /// Рядок курсора (0-indexed)
    pub line: u32,
    /// Символ (колонка) курсора (0-indexed)
    pub character: u32,
}

/// Відповідь із переліком completion items.
#[derive(Serialize, ToSchema)]
pub struct CompletionResponse {
    pub items: Vec<LspCompletionItem>,
}

/// Запит hover інформації: файли проекту + позиція курсора.
#[derive(Deserialize, ToSchema)]
pub struct HoverRequest {
    /// Карта файлів проекту: { "src/main.rs": "...", "src/lib.rs": "..." }
    pub files: HashMap<String, String>,
    /// Відносний шлях до файлу, де знаходиться курсор (наприклад "src/main.rs")
    pub file_path: String,
    /// Рядок курсора (0-indexed)
    pub line: u32,
    /// Символ (колонка) курсора (0-indexed)
    pub character: u32,
}

/// Відповідь із результатом hover (тип + документація).
#[derive(Serialize, ToSchema)]
pub struct HoverResponse {
    pub content: Option<String>,
}
