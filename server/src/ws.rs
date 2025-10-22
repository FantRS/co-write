use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_ws::{Message, handle};
use actix_rt::spawn;
use futures_util::StreamExt as _;

pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
) -> Result<HttpResponse, Error> {
    let (
        res,
        mut session,
        mut msg_stream
    ) = handle(&req, stream)?;

    spawn(async move {
        while let Some(msg) = msg_stream.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    println!("Received message: {text}");
                    let _ = session.text(text).await;
                }
                Ok(Message::Binary(bin)) => {
                    let _ = session.binary(bin).await;
                }
                Ok(Message::Close(reason)) => {
                    println!("WebSocket closed: {reason:?}");
                    break;
                }
                Err(err) => {
                    eprintln!("Errors WebSocket: {err}");
                    break;
                }
                Ok(_) => {}
            }
        }
    });

    Ok(res)
}
