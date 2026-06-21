use actix_web::{
    HttpResponse, Responder,
    web::{Data, Json, Path},
};
use uuid::Uuid;

use super::models::{CompletionRequest, CompletionResponse, HoverRequest, HoverResponse};
use super::session;
use crate::core::app_data::AppData;
use crate::app::{RequestResult, ServiceContext};

/// Отримання підказок автодоповнення від rust-analyzer для заданої позиції.
///
/// Приймає карту файлів проекту та позицію курсора (файл, рядок, символ).
/// Повертає список CompletionItem сумісних з форматом CodeMirror.
/// При першому виклику ініціалізує LSP-сесію (займає ~3-8 сек).
/// Наступні виклики — миттєві (~50-200 мс).
#[tracing::instrument(
    name = "lsp_complete",
    skip(app_data, body),
    fields(request_id, doc_id = %id)
)]
#[utoipa::path(
    post,
    path = "/api/documents/{id}/complete",
    params(("id" = Uuid, Path, description = "Uuid документа")),
    request_body(
        description = "Запит автодоповнення: файли проекту + позиція курсора",
        content_type = "application/json",
        content = CompletionRequest
    ),
    responses(
        (status = 200, description = "Список completion items", body = CompletionResponse)
    )
)]
pub async fn complete(
    id: Path<Uuid>,
    body: Json<CompletionRequest>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let doc_id = id.into_inner();
    let _ctx = ServiceContext::from(app_data.get_ref());
    let lsp = &app_data.lsp;

    let session = lsp
        .get_or_create(doc_id, &body.files)
        .await
        .map_err(|e| {
            tracing::error!("Не вдалося отримати LSP-сесію для {doc_id}: {e}");
            e
        })?;

    let file_content = body
        .files
        .get(&body.file_path)
        .map(|s| s.as_str())
        .unwrap_or("");

    let items = session::get_completions(
        &session,
        &body.file_path,
        file_content,
        body.line,
        body.character,
    )
    .await?;

    Ok(HttpResponse::Ok().json(CompletionResponse { items }))
}

/// Отримання інформації про елемент під курсором (Hover) від rust-analyzer.
///
/// Приймає карту файлів проекту та позицію курсора (файл, рядок, символ).
/// Повертає Markdown документацію або сигнатуру типу для показу у спливаючому вікні.
#[tracing::instrument(
    name = "lsp_hover",
    skip(app_data, body),
    fields(request_id, doc_id = %id)
)]
#[utoipa::path(
    post,
    path = "/api/documents/{id}/hover",
    params(("id" = Uuid, Path, description = "Uuid документа")),
    request_body(
        description = "Запит hover: файли проекту + позиція курсора",
        content_type = "application/json",
        content = HoverRequest
    ),
    responses(
        (status = 200, description = "Hover документація", body = HoverResponse)
    )
)]
pub async fn hover(
    id: Path<Uuid>,
    body: Json<HoverRequest>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let doc_id = id.into_inner();
    let _ctx = ServiceContext::from(app_data.get_ref());
    let lsp = &app_data.lsp;

    let session = lsp
        .get_or_create(doc_id, &body.files)
        .await
        .map_err(|e| {
            tracing::error!("Не вдалося отримати LSP-сесію для {doc_id}: {e}");
            e
        })?;

    let file_content = body
        .files
        .get(&body.file_path)
        .map(|s| s.as_str())
        .unwrap_or("");

    let content = session::get_hover(
        &session,
        &body.file_path,
        file_content,
        body.line,
        body.character,
    )
    .await?;

    Ok(HttpResponse::Ok().json(HoverResponse { content }))
}
