use actix_ws::Session;
use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;

pub struct Rooms(pub Arc<DashMap<Uuid, Vec<Connection>>>);

impl Rooms {
    pub fn new() -> Self {
        Self(Arc::new(DashMap::new()))
    }

    pub fn remove_connection(&self, room_id: &Uuid, connection_id: Uuid) {
        if let Some(mut room_connection) = self.0.get_mut(room_id) {
            room_connection.retain(|connection| connection.id != connection_id);

            if room_connection.is_empty() {
                self.0.remove(room_id);
            }
        }
    }
}

impl Default for Rooms {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for Rooms {
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}

#[derive(Clone)]
pub struct Connection {
    pub id: Uuid,
    pub session: Session,
}
