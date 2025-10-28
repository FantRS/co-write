use actix_web::{
    HttpRequest, Responder,
    web::{self, Path},
};
use actix_ws::{Message, handle};
use futures_util::StreamExt as _;
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

    let _ = document_service::send_existing_changes(&pool, &mut session, doc_id).await;

    actix_rt::spawn(async move {
        while let Some(msg) = msg_stream.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    tracing::debug!("Received message: {text}");
                    let _ = session.text(text).await;
                }
                Ok(Message::Binary(bin)) => match automerge::sync::Message::decode(&bin.clone()) {
                    Ok(_) => {
                        document_service::push_change(doc_id, connection.id, bin, &app_data).await
                    }
                    Err(err) => tracing::error!("Failed to decode sync message: {err:?}"),
                },
                Ok(Message::Close(reason)) => {
                    rooms.remove_connection(&doc_id, connection.id);

                    // ? видалення документа з БД

                    tracing::info!("WebSocket closed: {reason:?}");
                    break;
                }
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

pub fn add_connection(app_data: &AppData, id: Uuid, connection: Connection) {
    let mut room_ref = app_data.rooms.value.entry(id).or_default();
    let is_new_room = room_ref.is_empty();

    room_ref.push(connection);
    drop(room_ref);

    if is_new_room {
        let _ = document_service::run_merge_deamon(app_data, id);
    }
}
