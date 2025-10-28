use actix_web::{
    HttpResponse, Responder,
    web::{Data, Path},
};
use uuid::Uuid;

use crate::{
    app::services::document_service,
    core::{app_data::AppData, app_error::AppResult},
};

#[tracing::instrument(
    name = "create_document",
    skip(app_data),
    fields(request_id, title)
)]
#[utoipa::path(
    post, 
    path = "/api/create",
    request_body(
        description = "Username for create user",
        content_type = "text/plain",
        content = String
    ),
)]
pub async fn create_document(title: String, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let app_data = app_data.into_inner();
    
    match document_service::create_document(title, &app_data.pool).await {
        Ok(id) => {
            tracing::info!("Створено документ з Uuid: {}", &id);
            Ok(HttpResponse::Ok().body(id.to_string()))
        },
        Err(err) => {
            tracing::error!("Помилка: {}", &err);
            Err(err)
        }
    }
}

#[tracing::instrument(
    name = "get_document",
    skip(app_data),
    fields(request_id, doc_id = %id)
)]
#[utoipa::path(
    get, 
    path = "/api/documents/{id}",
    params(("id" = Uuid, Path, description = "Document ID to get the latest snapshot"))
)]
pub async fn get_document(id: Path<Uuid>, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let id = id.into_inner();
    let app_data = app_data.into_inner();
    match document_service::read_document(id, &app_data.pool).await {
        Ok(document) => {
            tracing::info!("Документ успішно отриманий з бази данних");
            Ok(HttpResponse::Ok().json(document))
        },
        Err(err) => {
            tracing::error!("Помилка: {}", &err);
            Err(err)
        }
    }
}
