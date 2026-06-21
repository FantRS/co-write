use actix_web::{
    HttpResponse, Responder,
    web::{Path, Data, Json},
};
use uuid::Uuid;

use super::service;
use super::models::{ExecutionResponse, ExecuteProjectRequest};
use crate::core::app_data::AppData;
use crate::app::{RequestResult, ServiceContext};

/// Виконання багатофайлового проекту Rust у ізольованому середовищі (пісочниці).
/// 
/// Отримує унікальний Uuid документа з URL та структуру файлів проекту у тілі запиту.
/// Створює відносну структуру папок та файлів, виконує проект і повертає результат (stdout, stderr).
#[tracing::instrument(
    name = "execute_code",
    skip(app_data, body),
    fields(request_id, doc_id = %id)
)]
#[utoipa::path(
    post, 
    path = "/api/documents/{id}/execute",
    params(("id" = Uuid, Path, description = "Uuid документа")),
    request_body(
        description = "Карта файлів проекту для виконання",
        content_type = "application/json",
        content = ExecuteProjectRequest
    ),
    responses(
        (status = 200, description = "Результат виконання коду", body = ExecutionResponse)
    )
)]
pub async fn execute_code(
    id: Path<Uuid>,
    body: Json<ExecuteProjectRequest>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let _id = id.into_inner();
    let ctx = ServiceContext::from(app_data.get_ref());
    
    // Виконуємо код проекту
    let result = service::execute_rust_code(&body.files, &ctx).await?;
    
    let response = ExecutionResponse {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
    };
    
    Ok(HttpResponse::Ok().json(response))
}

/// Запуск тестів проекту Rust у ізольованому середовищі.
/// 
/// Отримує унікальний Uuid документа з URL та структуру файлів проекту у тілі запиту.
/// Створює відносну структуру папок та файлів, виконує тести і повертає результат (stdout, stderr).
#[tracing::instrument(
    name = "execute_tests",
    skip(app_data, body),
    fields(request_id, doc_id = %id)
)]
#[utoipa::path(
    post, 
    path = "/api/documents/{id}/test",
    params(("id" = Uuid, Path, description = "Uuid документа")),
    request_body(
        description = "Карта файлів проекту для запуску тестів",
        content_type = "application/json",
        content = ExecuteProjectRequest
    ),
    responses(
        (status = 200, description = "Результат виконання тестів", body = ExecutionResponse)
    )
)]
pub async fn execute_tests(
    id: Path<Uuid>,
    body: Json<ExecuteProjectRequest>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let _id = id.into_inner();
    let ctx = ServiceContext::from(app_data.get_ref());
    
    // Виконуємо тести проекту
    let result = service::execute_rust_tests(&body.files, &ctx).await?;
    
    let response = ExecutionResponse {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
    };
    
    Ok(HttpResponse::Ok().json(response))
}

/// Форматування коду за допомогою rustfmt.
/// 
/// Отримує унікальний Uuid документа з URL та вміст файлу у тілі запиту.
/// Повертає відформатований код.
#[utoipa::path(
    post, 
    path = "/api/documents/{id}/format",
    params(("id" = Uuid, Path, description = "Uuid документа")),
    request_body(
        description = "Вихідний код для форматування",
        content_type = "text/plain",
        content = String
    ),
    responses(
        (status = 200, description = "Відформатований код", body = String)
    )
)]
#[tracing::instrument(
    name = "format_code",
    skip(_app_data, body),
    fields(request_id, doc_id = %id)
)]
pub async fn format_code(
    id: Path<Uuid>,
    body: String,
    _app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let _id = id.into_inner();
    let formatted = service::format_rust_code(&body).await?;
    Ok(HttpResponse::Ok().body(formatted))
}
