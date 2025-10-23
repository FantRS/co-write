use std::{net::TcpListener, process::ExitCode};

#[tokio::main]
async fn main() -> ExitCode {
    dotenvy::dotenv().ok();

    let host: String = std::env::var("HOST").unwrap();
    let port: String = std::env::var("PORT").unwrap();

    let addr = format!("{host}:{port}");
    let lst = TcpListener::bind(addr).unwrap();

    println!("Server listen port: {}", port);

    match server::run(lst).await {
        Ok(_) => {
            println!("SUCCESS!");
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            ExitCode::FAILURE
        }
    }
}
