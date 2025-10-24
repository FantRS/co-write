use std::{env, net::TcpListener};
use tracing::Instrument;
use server::core::{app_data::AppData, app_error::AppResult, database};

#[tokio::main]
async fn main() -> AppResult<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let span = tracing::info_span!("server");

    let host: String = env::var("SERVER_HOST")?;
    let port: String = env::var("SERVER_PORT")?;

    let addr = format!("{host}:{port}");
    let lst = TcpListener::bind(addr)?;

    println!("Server listen port: {}", port);

    let database_url = env::var("DATABASE_URL")?;
    let pool = database::establish_connection(database_url).await?;
    let app_data = AppData::new(pool);

    async {
        server::run(lst, app_data).await
    }.instrument(span).await
}
