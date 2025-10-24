use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_ws::{Message, handle};
use futures_util::StreamExt as _;

#[tracing::instrument(
    name = "WebSocket connect",
    skip(req, stream),
    fields(request_id)
)]
pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
) -> Result<HttpResponse, Error> {
    let (
        res,
        mut session,
        mut msg_stream
    ) = handle(&req, stream)?;
    
    tracing::info!("WebSocken connect creaded");

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
