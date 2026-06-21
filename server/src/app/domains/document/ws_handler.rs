use actix_web::{
    HttpRequest, Responder, ResponseError,
    web::{self, Path, Query},
};
use actix_ws::{CloseReason, Message, MessageStream, Session};
use futures_util::StreamExt as _;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use redis::Client;

use super::models::{
    Connection, FileSystemMessage, PubSubMessage, FileSystemEvent,
    SessionRole, ServerMessage,
};
use super::{service, repository};
use crate::core::app_data::AppData;
use crate::app::RequestResult;
use crate::app::domains::auth::validate_token;

// ─────────────────────────── Query params ────────────────────────────────────

#[derive(Debug, Deserialize)]
pub(crate) struct WsQuery {
    token: String,
}

// ─────────────────────────── WS Handler ──────────────────────────────────────

/// Обробник WebSocket-з'єднання для спільного редагування документа.
///
/// Валідує JWT з query param `?token=`, призначає роль (власник = Manager, перший чужий = Editor, решта = Reader),
/// надсилає snapshot файлів з БД, запускає цикл обробки повідомлень.
#[tracing::instrument(
    name = "ws_handler",
    skip(req, stream, app_data),
    fields(request_id, doc_id)
)]
#[utoipa::path(
    get,
    params(("id" = Uuid, description = "Uuid документа для встановлення WebSocket з'єднання")),
    path = "/api/ws/{id}",
)]
pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    doc_id: Path<Uuid>,
    query: Query<WsQuery>,
    app_data: web::Data<AppData>,
) -> RequestResult<impl Responder> {
    let doc_id = doc_id.into_inner();

    // Валідуємо JWT
    let claims = validate_token(&query.token, &app_data.jwt_secret)
        .map_err(|_| crate::app::RequestError::unauthorized("Невалідний токен для WS"))?;

    let (res, mut session, msg_stream) = actix_ws::handle(&req, stream)?;
    let app_data = app_data.get_ref().clone();
    let ctx = crate::app::ServiceContext::from(&app_data);

    // Надсилаємо клієнту накопичені Automerge-зміни
    if let Err(err) = service::send_existing_changes(doc_id, &mut session, &ctx).await {
        tracing::error!("Не вдалося надіслати наявні зміни: {err}");
        let _ = session.close(None).await;
        return Err(err);
    }

    // Визначаємо роль: власник = Manager, решта — збережена роль у DB або Reader
    let doc_owner_id = repository::read(doc_id, ctx.db_pool).await
        .ok()
        .and_then(|d| d.owner_id);
    let is_owner = doc_owner_id.map(|oid| oid == claims.sub).unwrap_or(false);
    let role = if is_owner {
        SessionRole::Manager
    } else {
        repository::get_member_role(doc_id, claims.sub, ctx.db_pool).await
            .ok()
            .flatten()
            .unwrap_or(SessionRole::Reader)
    };

    let connection = Connection {
        id: Uuid::now_v7(),
        user_id: claims.sub,
        username: claims.username.clone(),
        role,
        session: session.clone(),
    };

    // Надсилаємо snapshot файлів з БД новому учаснику
    if let Ok(files) = service::get_project_files(doc_id, &ctx).await {
        if !files.is_empty() {
            let snapshot_msg = serde_json::json!({
                "event": {
                    "action": "snapshot",
                    "files": files
                }
            });
            if let Ok(text) = serde_json::to_string(&snapshot_msg) {
                let _ = session.clone().text(text).await;
            }
        }
    }

    add_connection(&app_data, doc_id, connection.clone());
    broadcast_participants(&app_data, doc_id).await;
    tracing::info!("Створено WebSocket підключення для документа {doc_id} (user: {})", claims.username);

    handler_connection(doc_id, session, msg_stream, connection, app_data);

    Ok(res)
}

// ─────────────────────────── Connection loop ─────────────────────────────────

fn handler_connection(
    doc_id: Uuid,
    mut session: Session,
    mut msg_stream: MessageStream,
    connection: Connection,
    app_data: AppData,
) {
    actix_rt::spawn({
        async move {
            let ctx = crate::app::ServiceContext::from(&app_data);
            loop {
                tokio::select! {
                    msg = msg_stream.next() => {
                        match msg {
                            // ── Бінарний кадр: Automerge sync ──────────────
                            Some(Ok(Message::Binary(bin))) => {
                                // Перевіряємо роль
                                let can_edit = app_data.rooms.value
                                    .get(&doc_id)
                                    .and_then(|r| r.iter().find(|c| c.id == connection.id).map(|c| c.role.can_edit()))
                                    .unwrap_or(false);

                                if !can_edit {
                                    let denied = ServerMessage::PermissionDenied {
                                        reason: "Недостатньо прав для редагування (роль: Reader)".into()
                                    };
                                    if let Ok(text) = serde_json::to_string(&denied) {
                                        let _ = session.text(text).await;
                                    }
                                    continue;
                                }

                                let push_result = service::apply_sync_message(
                                    doc_id, connection.id, bin, &ctx
                                ).await;

                                let response: WsResponse = push_result.into();
                                let binary_response = serde_json::to_vec(&response).unwrap();
                                if let Err(err) = session.binary(binary_response).await {
                                    tracing::warn!("Не вдалося надіслати Automerge-відповідь: {err}");
                                    break;
                                }
                            }

                            // ── Текстовий кадр: FS-подія або RoleChange ───
                            Some(Ok(Message::Text(text))) => {
                                handle_text_message(
                                    doc_id,
                                    connection.id,
                                    text.to_string(),
                                    &ctx,
                                    &app_data,
                                ).await;
                            }

                            // ── Закриття з'єднання ─────────────────────────
                            Some(Ok(Message::Close(reason))) => {
                                tracing::info!("WebSocket закрито клієнтом: {reason:?}");
                                break;
                            }

                            Some(Err(err)) => {
                                tracing::error!("Помилка WebSocket потоку: {err}");
                                break;
                            }

                            Some(_) => (), // ping/pong
                            None => {
                                tracing::info!("WebSocket потік завершився");
                                break;
                            }
                        }
                    }
                }
            }

            // Видаляємо підключення та оповіщаємо інших
            app_data.rooms.remove_connection(&doc_id, connection.id);
            broadcast_participants(&app_data, doc_id).await;
            close_session(session, None).await;
            tracing::info!("Завершено WebSocket обробник для документа {doc_id}");
        }
    });
}

// ─────────────────────────── Text message handler ────────────────────────────

async fn handle_text_message(
    doc_id: Uuid,
    conn_id: Uuid,
    text: String,
    ctx: &crate::app::ServiceContext<'_>,
    app_data: &AppData,
) {
    // Спробуємо розпарсити як JSON для type-based повідомлень
    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
        // Cursor position broadcast — просто ретранслюємо всім іншим, без persist
        if val.get("type").and_then(|t| t.as_str()) == Some("cursor") {
            app_data.rooms.send_text(&doc_id, conn_id, text).await;
            return;
        }

        if val.get("type").and_then(|t| t.as_str()) == Some("role_change") {
            let target = val.get("target_conn_id").and_then(|v| v.as_str()).and_then(|s| Uuid::parse_str(s).ok());
            let role_str = val.get("new_role").and_then(|v| v.as_str());

            if let (Some(target_conn_id), Some(role_str)) = (target, role_str) {
                let new_role = match role_str {
                    "reader"  => SessionRole::Reader,
                    "editor"  => SessionRole::Editor,
                    "manager" => SessionRole::Manager,
                    _ => return,
                };

                let changed = app_data.rooms.set_role(&doc_id, target_conn_id, new_role, conn_id);
                if changed {
                    // Зберігаємо нову роль в БД
                    let target_user_id = app_data.rooms.value.get(&doc_id)
                        .and_then(|r| r.iter().find(|c| c.id == target_conn_id).map(|c| c.user_id));
                    if let Some(uid) = target_user_id {
                        if let Err(e) = repository::set_member_role(doc_id, uid, role_str, ctx.db_pool).await {
                            tracing::error!("Не вдалося зберегти роль в БД: {e}");
                        }
                    }
                    broadcast_participants(app_data, doc_id).await;
                } else {
                    // Відмова
                    if let Some(room) = app_data.rooms.value.get_mut(&doc_id) {
                        if let Some(mut requester) = room.iter().find(|c| c.id == conn_id).cloned() {
                            let denied = ServerMessage::PermissionDenied {
                                reason: "Недостатньо прав для зміни ролі".into()
                            };
                            if let Ok(t) = serde_json::to_string(&denied) {
                                let _ = requester.session.text(t).await;
                            }
                        }
                    }
                }
            }
            return;
        }
    }

    // Інакше — FS-подія
    let msg: FileSystemMessage = match serde_json::from_str(&text) {
        Ok(m) => m,
        Err(err) => {
            tracing::warn!("Не вдалося розпарсити подію ФС від {conn_id}: {err}");
            return;
        }
    };

    // Захист папки src
    match &msg.event {
        FileSystemEvent::Delete { path } => {
            if path == "src" {
                tracing::warn!("Спроба видалення 'src' відхилена");
                return;
            }
        }
        FileSystemEvent::Rename { old_path, new_path } => {
            if old_path == "src" || new_path == "src" {
                tracing::warn!("Спроба перейменування 'src' відхилена");
                return;
            }
        }
        _ => {}
    }

    // Перевіряємо роль для FS-подій (крім snapshot — він надходить від сервера)
    if !matches!(msg.event, FileSystemEvent::Snapshot { .. }) {
        let can_edit = app_data.rooms.value
            .get(&doc_id)
            .and_then(|r| r.iter().find(|c| c.id == conn_id).map(|c| c.role.can_edit()))
            .unwrap_or(false);

        if !can_edit {
            tracing::debug!("FS-подія від Reader {conn_id} відхилена");
            return;
        }
    }

    // Зберігаємо у БД
    if let Err(e) = service::save_fs_event(doc_id, &msg.event, ctx).await {
        tracing::error!("Не вдалося зберегти FS-подію в БД: {e}");
    }

    tracing::debug!("Подія файлової системи [{:?}] для документа {doc_id}", msg.event);

    // 1. Надсилаємо іншим клієнтам на ЦЬОМУ сервері
    app_data.rooms.send_text(&doc_id, conn_id, text).await;

    // 2. Публікуємо в Redis для інших реплік
    let pubsub_msg = PubSubMessage::FileSystemEvent {
        sender_conn_id: Uuid::nil(),
        event: msg.event,
    };
    if let Ok(serialized) = serde_json::to_vec(&pubsub_msg) {
        let channel_name = format!("document:room:{}", doc_id);
        let _ = ctx.redis.publish(&channel_name, serialized).await;
    }
}

// ─────────────────────────── Broadcast participants ──────────────────────────

/// Надсилає оновлений список учасників усім у кімнаті.
async fn broadcast_participants(app_data: &AppData, room_id: Uuid) {
    let participants = app_data.rooms.get_participants(&room_id);
    let msg = ServerMessage::ParticipantsUpdate { participants };
    if let Ok(text) = serde_json::to_string(&msg) {
        app_data.rooms.broadcast_text(&room_id, text).await;
    }
}

// ─────────────────────────── Room management ─────────────────────────────────

fn add_connection(app_data: &AppData, id: Uuid, connection: Connection) {
    let mut room_ref = app_data.rooms.value.entry(id).or_default();
    let is_new_room = room_ref.is_empty();
    room_ref.push(connection);
    drop(room_ref);

    if is_new_room {
        service::run_merge(id, app_data);
        start_redis_pubsub(id, app_data.clone());
    }
}

// ─────────────────────────── Redis PubSub ────────────────────────────────────

fn start_redis_pubsub(doc_id: Uuid, app_data: AppData) {
    let redis_url = app_data.redis_url.clone();
    let rooms = app_data.rooms.clone();
    let cancel_token = app_data.token();

    actix_rt::spawn(async move {
        tracing::info!("Запущено слухач Redis PubSub для кімнати {doc_id}");

        let client = match Client::open(redis_url.as_str()) {
            Ok(c) => c,
            Err(err) => {
                tracing::error!("Помилка створення клієнта Redis PubSub: {err}");
                return;
            }
        };

        let mut conn = match client.get_async_pubsub().await {
            Ok(c) => c,
            Err(err) => {
                tracing::error!("Не вдалося отримати PubSub з'єднання Redis: {err}");
                return;
            }
        };

        let channel_name = format!("document:room:{}", doc_id);
        if let Err(err) = conn.subscribe(&channel_name).await {
            tracing::error!("Не вдалося підписатися на канал Redis {channel_name}: {err}");
            return;
        }

        let mut pubsub_stream = conn.into_on_message();

        while !cancel_token.is_cancelled() {
            if rooms.is_empty(&doc_id) {
                tracing::info!("Кімната {doc_id} порожня — зупиняємо Redis PubSub");
                break;
            }

            tokio::select! {
                _ = cancel_token.cancelled() => {
                    tracing::info!("Токен скасування — зупиняємо Redis PubSub для {doc_id}");
                    break;
                }
                Some(msg) = pubsub_stream.next() => {
                    let payload: Vec<u8> = match msg.get_payload() {
                        Ok(p) => p,
                        Err(err) => {
                            tracing::error!("Помилка читання payload з Redis PubSub: {err}");
                            continue;
                        }
                    };

                    let pubsub_msg: PubSubMessage = match serde_json::from_slice(&payload) {
                        Ok(m) => m,
                        Err(err) => {
                            tracing::error!("Помилка десеріалізації PubSubMessage: {err}");
                            continue;
                        }
                    };

                    match pubsub_msg {
                        PubSubMessage::SyncChange { sender_conn_id, change } => {
                            rooms.send_change(
                                &doc_id,
                                sender_conn_id,
                                actix_web::web::Bytes::from(change),
                            ).await;
                        }
                        PubSubMessage::FileSystemEvent { event, .. } => {
                            let fs_msg = FileSystemMessage { event };
                            if let Ok(text) = serde_json::to_string(&fs_msg) {
                                rooms.send_text(&doc_id, Uuid::nil(), text).await;
                            }
                        }
                    }
                }
            }
        }
    });
}

// ─────────────────────────── Helpers ─────────────────────────────────────────

async fn close_session(session: Session, reason: Option<CloseReason>) {
    if let Err(err) = session.close(reason).await {
        tracing::warn!("Не вдалося чисто закрити сесію WebSocket: {err}");
    }
}

#[derive(Serialize, Deserialize)]
struct WsResponse {
    status: u16,
    message: String,
}

impl<T> From<RequestResult<T>> for WsResponse {
    fn from(value: RequestResult<T>) -> Self {
        match value {
            Ok(_) => Self { status: 200, message: "Ok".into() },
            Err(err) => Self {
                status: err.status_code().as_u16(),
                message: err.to_string(),
            },
        }
    }
}
