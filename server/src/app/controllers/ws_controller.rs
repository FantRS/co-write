use actix_web::{
    HttpRequest, Responder, ResponseError, web::{self, Path}
};
use actix_ws::{Message, handle};
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
    let (res, mut session, mut msg_stream) = handle(&req, stream)?;
    let (pool, rooms) = app_data.get_data();

    tracing::info!("WebSocket connect creaded");

    let connection = Connection {
        id: Uuid::new_v4(),
        session: session.clone(),
    };

    rooms
        .value
        .entry(doc_id)
        .or_default()
        .push(connection.clone());

    document_service::send_existing_changes(&pool, &mut session, doc_id).await?;

    actix_rt::spawn(async move {
        while let Some(msg) = msg_stream.next().await {
            match msg {
                // OnReceivedText
                Ok(Message::Text(text)) => {
                    tracing::debug!("Received message: {text}");
                    _ = session.text(text).await;
                }
                // OnReceivedBinary
                Ok(Message::Binary(bin)) => match automerge::sync::Message::decode(&bin.clone()) {
                    Ok(_) => {
                        let push_result = document_service::push_change(doc_id, connection.id, bin, &app_data).await;
                        let response: Response = push_result.into();
                        let json_response = serde_json::to_string(&response).unwrap();
                        _ = session.text(json_response).await;
                    }
                    Err(err) => tracing::error!("Failed to decode sync message: {err:?}"),
                },
                // OnCloseWebSocketConnection
                Ok(Message::Close(reason)) => {
                    rooms.remove_connection(&doc_id, connection.id);

                    // ? видалення документа з БД

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

fn add_connection(app_data: &AppData, id: Uuid, connection: Connection) {
    let mut room_ref = app_data.rooms.value.entry(id).or_default();
    let is_new_room = room_ref.is_empty();

    room_ref.push(connection);
    drop(room_ref);

    if is_new_room {
        let _ = document_service::run_merge_deamon(app_data, id);
    }
}

#[derive(Serialize, Deserialize)]
pub struct Response {
    status: u16,
    message: String,
}

impl<T> From<AppResult<T>> for Response {
    fn from(value: AppResult<T>) -> Self {
        match value {
            Ok(_) => {
                Self {
                    status: 200,
                    message: "Ok".into()
                }
            },
            Err(e) => {
                Self {
                    status: e.status_code().as_u16(),
                    message: e.to_string()
                }
            }
        }
    }
}