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
    fields(request_id)
)]
#[utoipa::path(
    get, path = "/ws/{id}",
    params(("doc_id" = String, Path, description = "Document ID for websocket connection"))
)]
pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    doc_id: Path<String>,
    app_data: web::Data<AppData>,
) -> AppResult<impl Responder> {
    let doc_id = Uuid::parse_str(&doc_id.into_inner())?;
    let (res, mut session, mut msg_stream) = handle(&req, stream)?;

    tracing::info!("WebSocken connect creaded");

    let connection = Connection {
        id: Uuid::new_v4(),
        session: session.clone(),
    };

    app_data
        .rooms
        .value
        .entry(doc_id)
        .or_default()
        .push(connection.clone());

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
                    app_data.rooms.remove_connection(&doc_id, connection.id);

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
