use std::process::ExitCode;

#[tokio::main]
async fn main() -> ExitCode {
    match server::run().await {
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
