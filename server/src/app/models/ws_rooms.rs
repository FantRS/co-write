use actix_web::web::Bytes;
use actix_ws::Session;
use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;

pub struct Rooms {
    pub value: Arc<DashMap<Uuid, Vec<Connection>>>,
}

impl Rooms {
    pub fn remove_connection(&self, room_id: &Uuid, connection_id: Uuid) {
        if let Some(mut room_connections) = self.value.get_mut(room_id) {
            room_connections.retain(|connection| connection.id != connection_id);

            if room_connections.is_empty() {
                drop(room_connections);
                self.value.remove(room_id);
            }
        }
    }

    pub async fn send_change(&self, room_id: &Uuid, connection_id: Uuid, change: Bytes) {
        if let Some(mut clients) = self.value.get_mut(&room_id) {
            for conn in clients.iter_mut() {
                if conn.id != connection_id {
                    let _ = conn.session.binary(change.clone()).await;
                }
            }
        }
    }
}

impl Default for Rooms {
    fn default() -> Self {
        Self {
            value: Arc::new(DashMap::new()),
        }
    }
}

impl Clone for Rooms {
    fn clone(&self) -> Self {
        Self {
            value: self.value.clone(),
        }
    }
}

#[derive(Clone)]
pub struct Connection {
    pub id: Uuid,
    pub session: Session,
}
