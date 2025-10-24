use server::{
    core::{app_data::AppData, app_error::AppResult, database},
    telemetry,
};
use std::{env, net::TcpListener};

#[tokio::main]
async fn main() -> AppResult<()> {
    dotenvy::dotenv().ok();
    telemetry::init_logger("debug");

    let addr = format_addr()?;
    let lst = TcpListener::bind(&addr)?;

    println!("Server address: {}", addr);

    let database_url = env::var("DATABASE_URL")?;
    let pool = database::establish_connection(database_url).await?;
    let app_data = AppData::new(pool);

    server::run(lst, app_data).await
}

fn format_addr() -> AppResult<String> {
    let host: String = env::var("SERVER_HOST")?;
    let port: String = env::var("SERVER_PORT")?;

    Ok(format!("{host}:{port}"))
}
