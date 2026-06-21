use std::process::ExitCode;

/// Головна точка входу в додаток. Запускає сервер та обробляє критичні помилки.
#[actix_web::main]
async fn main() -> ExitCode {
    if let Err(e) = server::start().await {
        tracing::error!("КРИТИЧНА ПОМИЛКА СЕРВЕРА: {}", e);
        return ExitCode::FAILURE;
    };

    ExitCode::SUCCESS
}
