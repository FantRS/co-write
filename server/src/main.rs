use server::{
    app::models::ws_rooms::Rooms,
    core::{app_data::AppData, app_error::AppResult, database},
    telemetry,
};
use std::{env, net::TcpListener};

#[actix_web::main]
async fn main() -> AppResult<()> {
    dotenvy::dotenv().ok();
    telemetry::init_logger("debug");

    let addr = format_addr()?;
    let lst = TcpListener::bind(&addr)?;

    tracing::info!("The server is running at the address: {addr}");

    let database_url = env::var("DATABASE_URL")?;
    let pool = database::establish_connection(database_url).await?;
    let rooms = Rooms::default();
    let app_data = AppData::builder()
        .with_pool(pool)
        .with_rooms(rooms)
        .build()?;

    let cancel = app_data.token();
    let server = actix_web::rt::spawn(server::run(lst, app_data.clone()));

    tokio::signal::ctrl_c().await?;
    tracing::info!("Shutdown signal received");

    cancel.cancel();

    if let Err(err) = server.await {
        tracing::error!("Server task failed: {err}");
    }

    tracing::info!("Graceful shutdown complete");
    Ok(())
}

fn format_addr() -> AppResult<String> {
    let host: String = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: String = env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());

    Ok(format!("{host}:{port}"))
}
