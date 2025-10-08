use std::{net::TcpListener, process::ExitCode};

#[tokio::main]
async fn main() -> ExitCode {
    dotenvy::dotenv().ok();

    let lst = TcpListener::bind("127.0.0.1:8080").unwrap();

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
