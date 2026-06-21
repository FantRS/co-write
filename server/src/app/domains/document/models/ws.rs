use actix_web::web::Bytes;
use actix_ws::Session;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

// ─────────────────────────── Roles ───────────────────────────────────────────

/// Роль учасника сесії.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SessionRole {
    /// Тільки читання: не може редагувати файли та код.
    Reader,
    /// Може редагувати.
    Editor,
    /// Може редагувати та керувати ролями учасників.
    Manager,
}

impl SessionRole {
    pub fn can_edit(&self) -> bool {
        matches!(self, SessionRole::Editor | SessionRole::Manager)
    }

    pub fn can_manage(&self) -> bool {
        matches!(self, SessionRole::Manager)
    }
}

// ─────────────────────────── ParticipantInfo ─────────────────────────────────

/// Інформація про учасника сесії (для відправки клієнтам).
#[derive(Clone, Serialize, Deserialize)]
pub struct ParticipantInfo {
    pub conn_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub role: SessionRole,
}

// ─────────────────────────── Rooms ───────────────────────────────────────────

/// Кімнати з активними веб-сокет підключеннями клієнтів до документів.
pub struct Rooms {
    pub value: Arc<DashMap<Uuid, Vec<Connection>>>,
}

impl Default for Rooms {
    fn default() -> Self {
        Self {
            value: Arc::new(DashMap::new()),
        }
    }
}

impl Rooms {
    /// Видаляє підключення з кімнати. Якщо кімната стає порожньою — видаляється повністю.
    pub fn remove_connection(&self, room_id: &Uuid, connection_id: Uuid) {
        if let Some(mut room_connections) = self.value.get_mut(room_id) {
            room_connections.retain(|c| c.id != connection_id);
            if room_connections.is_empty() {
                drop(room_connections);
                self.value.remove(room_id);
            }
        }
    }

    /// Повертає список учасників кімнати.
    pub fn get_participants(&self, room_id: &Uuid) -> Vec<ParticipantInfo> {
        self.value
            .get(room_id)
            .map(|r| {
                r.iter()
                    .map(|c| ParticipantInfo {
                        conn_id: c.id,
                        user_id: c.user_id,
                        username: c.username.clone(),
                        role: c.role.clone(),
                    })
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Змінює роль учасника. Тільки Manager може це робити.
    /// Повертає true якщо зміна виконана.
    pub fn set_role(
        &self,
        room_id: &Uuid,
        target_conn_id: Uuid,
        new_role: SessionRole,
        requester_conn_id: Uuid,
    ) -> bool {
        if let Some(mut room) = self.value.get_mut(room_id) {
            // Перевіряємо що requester є Manager
            let is_manager = room
                .iter()
                .any(|c| c.id == requester_conn_id && c.role.can_manage());
            if !is_manager {
                return false;
            }
            // Менеджер не може понизити сам себе
            if target_conn_id == requester_conn_id {
                return false;
            }
            if let Some(target) = room.iter_mut().find(|c| c.id == target_conn_id) {
                target.role = new_role;
                return true;
            }
        }
        false
    }

    /// Надсилає бінарне оновлення (Automerge) всім учасникам окрім відправника.
    pub async fn send_change(&self, room_id: &Uuid, connection_id: Uuid, change: Bytes) {
        if let Some(room) = self.value.get_mut(room_id) {
            let clients = room.clone();
            for mut conn in clients.into_iter() {
                if conn.id == connection_id {
                    continue;
                }
                let change = change.clone();
                actix_rt::spawn(async move {
                    if let Err(err) = conn.session.binary(change).await {
                        tracing::warn!("Не вдалося надіслати зміни клієнту {connection_id}: {err}");
                    }
                });
            }
        }
    }

    /// Надсилає текстове JSON-повідомлення всім учасникам окрім відправника.
    pub async fn send_text(&self, room_id: &Uuid, connection_id: Uuid, text: String) {
        if let Some(room) = self.value.get_mut(room_id) {
            let clients = room.clone();
            for mut conn in clients.into_iter() {
                if conn.id == connection_id {
                    continue;
                }
                let text = text.clone();
                actix_rt::spawn(async move {
                    if let Err(err) = conn.session.text(text).await {
                        tracing::warn!(
                            "Не вдалося надіслати текстове повідомлення клієнту {connection_id}: {err}"
                        );
                    }
                });
            }
        }
    }

    /// Надсилає текстове повідомлення ВСІМ учасникам у кімнаті (включаючи відправника).
    pub async fn broadcast_text(&self, room_id: &Uuid, text: String) {
        if let Some(room) = self.value.get_mut(room_id) {
            let clients = room.clone();
            for mut conn in clients.into_iter() {
                let text = text.clone();
                actix_rt::spawn(async move {
                    if let Err(err) = conn.session.text(text).await {
                        tracing::warn!("Не вдалося надіслати broadcast повідомлення: {err}");
                    }
                });
            }
        }
    }

    /// Перевіряє чи кімната порожня.
    pub fn is_empty(&self, room_id: &Uuid) -> bool {
        self.value
            .get(room_id)
            .map(|r| r.is_empty())
            .unwrap_or(true)
    }
}

impl Clone for Rooms {
    fn clone(&self) -> Self {
        Self {
            value: Arc::clone(&self.value),
        }
    }
}

// ─────────────────────────── Connection ──────────────────────────────────────

/// Модель активного WebSocket підключення з роллю учасника.
#[derive(Clone)]
pub struct Connection {
    pub id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub role: SessionRole,
    pub session: Session,
}

// ─────────────────────────── WS Client Messages ──────────────────────────────

/// Повідомлення від клієнта через WebSocket (текстовий фрейм).
#[derive(Deserialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    /// Запит на зміну ролі (тільки Manager).
    RoleChange {
        target_conn_id: Uuid,
        new_role: SessionRole,
    },
    /// Подія файлової системи.
    #[serde(untagged)]
    FileSystem(FileSystemMessage),
}

// ─────────────────────────── WS Server Messages ──────────────────────────────

/// Повідомлення від сервера до клієнта (текстовий фрейм).
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    /// Оновлений список учасників сесії.
    ParticipantsUpdate { participants: Vec<ParticipantInfo> },
    /// Відмова у доступі.
    PermissionDenied { reason: String },
}

// ─────────────────────────── Pub/Sub ─────────────────────────────────────────

/// Тип повідомлення, що передається через Redis Pub/Sub між репліками сервера.
#[derive(Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PubSubMessage {
    /// Бінарне Automerge sync-повідомлення (base64 encoded для JSON).
    SyncChange {
        sender_conn_id: Uuid,
        #[serde(with = "base64_bytes")]
        change: Vec<u8>,
    },
    /// Подія файлової системи — синхронізація дерева файлів між клієнтами.
    FileSystemEvent {
        sender_conn_id: Uuid,
        event: FileSystemEvent,
    },
}

// ─────────────────────────── FileSystem Events ───────────────────────────────

/// Подія зміни файлової системи проекту, що синхронізується між усіма учасниками.
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum FileSystemEvent {
    /// Файл або папку створено / оновлено (upsert).
    Upsert { path: String, content: String, is_dir: bool },
    /// Файл або папку видалено.
    Delete { path: String },
    /// Файл або папку перейменовано.
    Rename { old_path: String, new_path: String },
    /// Повна синхронізація дерева файлів (для нових учасників).
    Snapshot { files: HashMap<String, String> },
}

/// Клієнтська обгортка для файлової події, що надходить через WebSocket.
#[derive(Serialize, Deserialize, Debug)]
pub struct FileSystemMessage {
    pub event: FileSystemEvent,
}

// ─────────────────────────── base64 serde helper ─────────────────────────────

/// Серіалізація Vec<u8> як base64-рядка для передачі через JSON (Redis Pub/Sub).
mod base64_bytes {
    use base64::Engine as _;
    use serde::{Deserializer, Serializer, de::Error};

    pub fn serialize<S: Serializer>(bytes: &Vec<u8>, s: S) -> Result<S::Ok, S::Error> {
        let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
        s.serialize_str(&encoded)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<u8>, D::Error> {
        let s = <String as serde::Deserialize>::deserialize(d)?;
        base64::engine::general_purpose::STANDARD.decode(&s).map_err(D::Error::custom)
    }
}
