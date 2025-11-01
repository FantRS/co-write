use sqlx::PgPool;
use tokio_util::sync::CancellationToken;

use crate::{
    app::models::ws_rooms::Rooms,
    core::app_error::{AppError, AppResult},
};

#[derive(Clone)]
pub struct AppData {
    pub pool: PgPool,
    pub rooms: Rooms,
    pub cancel_token: CancellationToken,
}

impl AppData {
    pub fn builder() -> AppDataBuilder {
        AppDataBuilder::default()
    }

    pub fn get_data(&self) -> (PgPool, Rooms) {
        let pool = self.pool.clone();
        let rooms = self.rooms.clone();

        (pool, rooms)
    }

    pub fn token(&self) -> CancellationToken {
        self.cancel_token.clone()
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
            pool: self
                .pool
                .ok_or(AppError::InternalServer("PgPool not set".into()))?,

            rooms: self
                .rooms
                .ok_or(AppError::InternalServer("Rooms not set".into()))?,

            cancel_token: CancellationToken::new(),
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
