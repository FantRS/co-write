use actix_web::{
    HttpRequest, HttpResponse, Responder,
    web::{Data, Json, Path},
};
use serde::Deserialize;
use uuid::Uuid;

use super::service;
use crate::core::app_data::AppData;
use crate::app::{RequestResult, ServiceContext};
use crate::app::domains::auth::{validate_token, Claims};

// ─────────────────────────── Helpers ─────────────────────────────────────────

/// Витягує та валідує JWT з заголовка Authorization запиту.
fn extract_claims(req: &HttpRequest, jwt_secret: &str) -> RequestResult<Claims> {
    let header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| crate::app::RequestError::unauthorized("Відсутній Authorization заголовок"))?;

    let token = header
        .strip_prefix("Bearer ")
        .ok_or_else(|| crate::app::RequestError::unauthorized("Неправильний формат Authorization"))?;

    validate_token(token, jwt_secret)
}

// ─────────────────────────── Document endpoints ───────────────────────────────

/// Список всіх документів поточного користувача (власні + спільні).
#[tracing::instrument(name = "list_documents", skip(req, app_data))]
pub async fn list_documents(
    req: HttpRequest,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let claims = extract_claims(&req, &app_data.jwt_secret)?;
    let ctx = ServiceContext::from(app_data.get_ref());
    let docs = service::list_user_documents(claims.sub, &ctx).await?;
    Ok(HttpResponse::Ok().json(docs))
}

/// Створення нового документа.
#[tracing::instrument(name = "create_document", skip(req, app_data), fields(title = %title))]
#[utoipa::path(
    post,
    path = "/api/documents/create",
    request_body(description = "Назва нового документа", content_type = "text/plain", content = String),
)]
pub async fn create_document(
    req: HttpRequest,
    title: String,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let claims = extract_claims(&req, &app_data.jwt_secret)?;
    let ctx = ServiceContext::from(app_data.get_ref());
    let id = service::create_document(title, claims.sub, &ctx).await?;
    tracing::info!("Створено новий документ з Uuid: {}", id);
    Ok(HttpResponse::Created().body(id.to_string()))
}

/// Отримання останнього зліпка (snapshot) документа.
#[tracing::instrument(name = "get_document", skip(req, app_data), fields(doc_id = %id))]
#[utoipa::path(
    get,
    path = "/api/documents/{id}",
    params(("id" = Uuid, Path, description = "Uuid документа")),
)]
pub async fn get_document(
    req: HttpRequest,
    id: Path<Uuid>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    extract_claims(&req, &app_data.jwt_secret)?;
    let id = id.into_inner();
    let ctx = ServiceContext::from(app_data.get_ref());
    let content = service::read_document(id, &ctx).await?;
    tracing::info!("Документ успішно отримано");
    Ok(HttpResponse::Ok().body(content))
}

/// Отримання назви документа.
#[tracing::instrument(name = "get_document_title", skip(req, app_data), fields(doc_id = %id))]
#[utoipa::path(
    get,
    path = "/api/documents/{id}/title",
    params(("id" = Uuid, Path, description = "Uuid документа")),
)]
pub async fn get_document_title(
    req: HttpRequest,
    id: Path<Uuid>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    extract_claims(&req, &app_data.jwt_secret)?;
    let id = id.into_inner();
    let ctx = ServiceContext::from(app_data.get_ref());
    let title = service::get_document_title(id, &ctx).await?;
    Ok(HttpResponse::Ok().body(title))
}

// ─────────────────────────── Members ─────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct AddMemberRequest {
    pub username: String,
}

/// Додає учасника до проекту за username (тільки власник).
#[tracing::instrument(name = "add_member", skip(req, app_data), fields(doc_id = %doc_id))]
pub async fn add_member(
    req: HttpRequest,
    doc_id: Path<Uuid>,
    body: Json<AddMemberRequest>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let claims = extract_claims(&req, &app_data.jwt_secret)?;
    let ctx = ServiceContext::from(app_data.get_ref());
    service::add_member_by_username(doc_id.into_inner(), &body.username, claims.sub, &ctx).await?;
    Ok(HttpResponse::Ok().body("Учасника додано"))
}

/// Видаляє учасника з проекту (тільки власник).
#[tracing::instrument(name = "remove_member", skip(req, app_data))]
pub async fn remove_member(
    req: HttpRequest,
    path: Path<(Uuid, Uuid)>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    let claims = extract_claims(&req, &app_data.jwt_secret)?;
    let (doc_id, target_user_id) = path.into_inner();
    let ctx = ServiceContext::from(app_data.get_ref());
    service::remove_member(doc_id, target_user_id, claims.sub, &ctx).await?;
    Ok(HttpResponse::Ok().body("Учасника видалено"))
}

// ─────────────────────────── Participants (Session) ──────────────────────────

/// Повертає список учасників активної сесії документа.
pub async fn get_participants(
    req: HttpRequest,
    doc_id: Path<Uuid>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    extract_claims(&req, &app_data.jwt_secret)?;
    let participants = app_data.rooms.get_participants(&doc_id.into_inner());
    Ok(HttpResponse::Ok().json(participants))
}

// ─────────────────────────── Export ──────────────────────────────────────────

/// Експортує файли проекту як tar.xz архів.
pub async fn export_project(
    req: HttpRequest,
    doc_id: Path<Uuid>,
    app_data: Data<AppData>,
) -> RequestResult<impl Responder> {
    extract_claims(&req, &app_data.jwt_secret)?;
    let ctx = ServiceContext::from(app_data.get_ref());
    let archive = service::export_project(doc_id.into_inner(), &ctx).await?;

    Ok(HttpResponse::Ok()
        .content_type("application/x-xz")
        .insert_header(("Content-Disposition", "attachment; filename=\"project.tar.xz\""))
        .body(archive))
}
