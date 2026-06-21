use uuid::Uuid;

/// Модель рядка таблиці documents в базі даних.
#[derive(sqlx::FromRow)]
pub struct DocumentRow {
    pub id: Uuid,
    pub title: String,
    pub content: Vec<u8>,
    pub owner_id: Option<Uuid>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Модель рядка таблиці document_updates в базі даних.
#[derive(Clone, sqlx::FromRow)]
pub struct ChangeRow {
    pub id: Uuid,
    pub update: Vec<u8>,
}

impl ChangeRow {
    /// Розділяє вектор структур ChangeRow на два окремих вектори: ідентифікаторів та бінарних даних.
    pub fn split_data(data: Vec<Self>) -> (Vec<Uuid>, Vec<Vec<u8>>) {
        data.into_iter().map(|c| (c.id, c.update)).unzip()
    }
}

/// Модель рядка таблиці project_files.
#[derive(sqlx::FromRow)]
pub struct ProjectFileRow {
    pub id: Uuid,
    pub path: String,
    pub content: String,
    pub is_dir: bool,
}

/// Зведена інформація про документ для відображення у лобі.
#[derive(sqlx::FromRow, serde::Serialize)]
pub struct DocumentSummary {
    pub id: Uuid,
    pub title: String,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub owner_id: Option<Uuid>,
    pub owner_username: String,
    pub is_owner: bool,
}
