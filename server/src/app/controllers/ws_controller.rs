use actix_web::{
    HttpRequest, Responder, ResponseError,
    web::{self, Path},
};
use actix_ws::Message;
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
    let (res, mut session, mut msg_stream) = actix_ws::handle(&req, stream)?;
    let (pool, rooms) = app_data.get_data();

    tracing::info!("WebSocket connection created");

    let connection = Connection {
        id: Uuid::new_v4(),
        session: session.clone(),
    };

    add_connection(&app_data, doc_id, connection.clone());
    document_service::send_existing_changes(doc_id, &mut session, &pool).await?;

    actix_rt::spawn(async move {
        while let Some(msg) = msg_stream.next().await {
            match msg {
                // OnReceivedText
                Ok(Message::Text(text)) => {
                    tracing::debug!("Received message: {text}");
                    if let Err(err) = session.text(text).await {
                        tracing::warn!("Failed to send message: {err}");
                    }
                }
                // OnReceivedBinary
                Ok(Message::Binary(bin)) => match automerge::sync::Message::decode(&bin.clone()) {
                    Ok(_) => {
                        let push_result = document_service::push_change(
                            doc_id, connection.id, bin, &app_data
                        ).await;

                        let response: WsResponse = push_result.into();
                        let binary_response = serde_json::to_vec(&response).unwrap();

                        if let Err(err) = session.binary(binary_response).await {
                            tracing::warn!("Failed to send response: {err}");
                        }
                    }
                    Err(err) => tracing::error!("Failed to decode sync message: {err:?}"),
                },
                // OnCloseWebSocketConnection
                Ok(Message::Close(reason)) => {
                    rooms.remove_connection(&doc_id, connection.id);
                    tracing::info!("WebSocket closed: {reason:?}");
                    break;
                }
                // OnErrorWebSocketConnection
                Err(err) => {
                    tracing::error!("Errors WebSocket: {err}");
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(res)
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
