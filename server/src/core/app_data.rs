use sqlx::PgPool;

use crate::{
    app::models::ws_rooms::Rooms,
    core::app_error::{AppError, AppResult},
};

#[derive(Clone)]
pub struct AppData {
    pub pool: PgPool,
    pub rooms: Rooms,
}

impl AppData {
    pub fn builder() -> AppDataBuilder {
        AppDataBuilder::default()
    }
}

#[derive(Default)]
pub struct AppDataBuilder {
    pub pool: Option<PgPool>,
    pub rooms: Option<Rooms>,
}

impl AppDataBuilder {
    pub fn build(self) -> AppResult<AppData> {
        let data = AppData {
            pool: self.pool.ok_or(AppError::InternalServer("PgPool not set".into()))?,
            rooms: self.rooms.ok_or(AppError::InternalServer("Rooms not set".into()))?,
        };

        Ok(data)
    }

    pub fn with_pool(mut self, pool: PgPool) -> Self {
        self.pool = Some(pool);
        self
    }

    pub fn with_rooms(mut self, rooms: Rooms) -> Self {
        self.rooms = Some(rooms);
        self
    }
}
