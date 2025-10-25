use actix_web::{
    HttpRequest, Responder,
    web::{self, Path},
};
use actix_ws::{Message, handle};
use futures_util::StreamExt as _;
use uuid::Uuid;

use crate::{
    app::models::ws_rooms::{Connection, Rooms},
    core::app_error::AppResult,
};

#[tracing::instrument(
    name = "WebSocket connect",
    skip(req, stream, rooms),
    fields(request_id)
)]
pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    doc_id: Path<String>,
    rooms: web::Data<Rooms>,
) -> AppResult<impl Responder> {
    let doc_id = Uuid::parse_str(&doc_id.into_inner())?;
    let (res, mut session, mut msg_stream) = handle(&req, stream)?;

    tracing::info!("WebSocken connect creaded");

    let connection = Connection {
        id: Uuid::new_v4(),
        session: session.clone(),
    };

    rooms.0.entry(doc_id).or_default().push(connection.clone());

    actix_rt::spawn(async move {
        while let Some(msg) = msg_stream.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    tracing::trace!("Received message: {text}");
                    let _ = session.text(text).await;
                }
                Ok(Message::Binary(bin)) => {
                    let _ = session.binary(bin).await;
                }
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
