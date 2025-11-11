use actix_web::{
    HttpRequest, Responder, ResponseError,
    web::{self, Path},
};
use actix_ws::{CloseReason, Message, MessageStream, Session};
use futures_util::StreamExt as _;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    app::{models::ws_rooms::Connection, services::document_service},
    core::{app_data::AppData, app_error::AppResult},
};

#[tracing::instrument(
    name = "ws_handler",
    skip(req, stream, app_data),
    fields(request_id, doc_id)
)]
#[utoipa::path(
    get, 
    params(("id" = Uuid, description = "Document ID for websocket connection")),
    path = "/api/ws/{id}",
)]
pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    doc_id: Path<Uuid>,
    app_data: web::Data<AppData>,
) -> AppResult<impl Responder> {
    let doc_id = doc_id.into_inner();
    let (res, mut session, msg_stream) = actix_ws::handle(&req, stream)?;
    let app_data = app_data.get_ref().clone();

    if let Err(err) =
        document_service::send_existing_changes(doc_id, &mut session, &app_data.pool).await
    {
        tracing::error!("Failed to send axisting changes: {err}");
        let _ = session.close(None).await;

        return Err(err);
    }

    let connection = Connection {
        id: Uuid::new_v4(),
        session: session.clone(),
    };

    add_connection(&app_data, doc_id, connection.clone());
    tracing::info!("WebSocket connection created");

    handler_connection(doc_id, session, msg_stream, connection, app_data);

    Ok(res)
}

fn handler_connection(
    doc_id: Uuid,
    mut session: Session,
    mut msg_stream: MessageStream,
    connection: Connection,
    app_data: AppData,
) {
    actix_rt::spawn({
        async move {
            loop {
                tokio::select! {
                    msg = msg_stream.next() => {
                        match msg {
                            // OnReceivedText
                            Some(Ok(Message::Text(text)) ) => {
                                tracing::debug!("Received message: {text}");
                                if let Err(err) = session.text(text).await {
                                    tracing::warn!("Failed to send message: {err}");
                                    break;
                                }
                            }
                            // OnReceivedBinary
                            Some(Ok(Message::Binary(bin))) => match automerge::sync::Message::decode(&bin.clone()) {
                                Ok(_) => {
                                    let push_result = document_service::push_change(
                                        doc_id, connection.id, bin, &app_data
                                    ).await;

                                    let response: WsResponse = push_result.into();
                                    let binary_response = serde_json::to_vec(&response).unwrap();

                                    if let Err(err) = session.binary(binary_response).await {
                                        tracing::warn!("Failed to send response: {err}");
                                        break;
                                    }
                                }
                                Err(err) => tracing::error!("Failed to decode sync message: {err:?}"),
                            },
                            // OnCloseWebSocketConnection
                            Some(Ok(Message::Close(reason))) => {
                                tracing::info!("WebSocket closed: {reason:?}");
                                break;
                            }
                            // OnErrorWebSocketConnection
                            Some(Err(err)) => {
                                tracing::error!("Errors WebSocket: {err}");
                                break;
                            }
                            Some(_) => (),
                            None => {
                                tracing::info!("WebSocket stream ended (client disconnected)");
                                break;
                            }
                        }
                    }
                }
            }

            app_data.rooms.remove_connection(&doc_id, connection.id);
            close_session(session, None).await;

            tracing::info!("WebSocket handler finished for {doc_id}");
        }
    });
}

/// Adds a connection to the room, if it does not exist, creates
/// it and starts automatic application of changes to the document
fn add_connection(app_data: &AppData, id: Uuid, connection: Connection) {
    let mut room_ref = app_data.rooms.value.entry(id).or_default();
    let is_new_room = room_ref.is_empty();

    room_ref.push(connection);
    drop(room_ref);

    if is_new_room {
        document_service::run_merge(id, app_data);
    }
}

async fn close_session(session: Session, reason: Option<CloseReason>) {
    if let Err(err) = session.close(reason).await {
        tracing::warn!("Failed to close session cleanly: {err}");
    }
}

#[derive(Serialize, Deserialize)]
struct WsResponse {
    status: u16,
    message: String,
}

impl<T> From<AppResult<T>> for WsResponse {
    fn from(value: AppResult<T>) -> Self {
        match value {
            Ok(_) => Self {
                status: 200,
                message: "Ok".into(),
            },
            Err(err) => Self {
                status: err.status_code().as_u16(),
                message: err.to_string(),
            },
        }
    }
}
