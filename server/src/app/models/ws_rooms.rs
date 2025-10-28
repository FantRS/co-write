use actix_web::web::Bytes;
use actix_ws::Session;
use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;

pub struct Rooms {
    pub value: Arc<DashMap<Uuid, Vec<Connection>>>,
}

impl Rooms {
    /// Removes a connection from a room. If the room is becomes empty, it is deleted.
    pub fn remove_connection(&self, room_id: &Uuid, connection_id: Uuid) {
        if let Some(mut room_connections) = self.value.get_mut(room_id) {
            room_connections.retain(|connection| connection.id != connection_id);

            if room_connections.is_empty() {
                drop(room_connections);
                self.value.remove(room_id);
            }
        }
    }

    /// Send changes to all participants in the room (except for the creator).
    pub async fn send_change(&self, room_id: &Uuid, connection_id: Uuid, change: Bytes) {
        if let Some(room) = self.value.get(room_id) {
            let mut clients: Vec<_> = room.clone();
            drop(room);

            for conn in clients.iter_mut() {
                if conn.id != connection_id
                    && let Err(err) = conn.session.binary(change.clone()).await
                {
                    tracing::warn!("Failed to send change to {connection_id}: {err}");
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
