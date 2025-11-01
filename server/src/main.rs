use server::{
    app::models::ws_rooms::Rooms,
    core::{app_config::AppConfig, app_data::AppData, app_error::AppResult, database},
    telemetry,
};
use std::net::TcpListener;

#[actix_web::main]
async fn main() -> AppResult<()> {
    dotenvy::dotenv().ok();
    telemetry::init_logger("debug");

    tracing::info!("Turning on the server...");

    let app_config = AppConfig::build()?;
    let lst = TcpListener::bind(app_config.app.get_addr())?;
    let pool = database::connect(app_config.database.conn()).await?;
    let app_data = AppData::builder()
        .with_pool(pool)
        .with_rooms(Rooms::default())
        .build()?;

    let server = actix_web::rt::spawn(server::run(lst, app_data.clone()));

    tokio::signal::ctrl_c().await?;
    app_data.cancel_token.cancel();

    match server.await {
        Ok(_) => tracing::info!("Graceful shutdown complete"),
        Err(e) => tracing::error!("Server task failed: {}", e),
    }

    Ok(())
}
