use sqlx::PgPool;

#[derive(Clone)]
pub struct AppData {
    pub pool: PgPool,
}

impl AppData {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}