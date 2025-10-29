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
    fields(request_id, title = %title)
)]
#[utoipa::path(
    post, 
    path = "/api/create",
    request_body(
        description = "Title for create document",
        content_type = "text/plain",
        content = String
    ),
)]
pub async fn create_document(title: String, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let app_data = app_data.into_inner();
    let resp_res = document_service::create_document(title, &app_data.pool).await;

    match &resp_res {
        Ok(id) => tracing::info!("Created document with Uuid: {}", &id),
        Err(err) => tracing::error!("Error: {}", &err),
    }

    Ok(HttpResponse::Created().body(resp_res?.to_string()))
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
    let res = document_service::read_document(id, &app_data.pool).await;

    match &res {
        Ok(_) => tracing::info!("Document successfully retrieved from database"),
        Err(err) => tracing::error!("Error: {}", &err),
    }

    Ok(HttpResponse::Ok().body(res?))
}

#[tracing::instrument(
    name = "get_document_title",
    skip(app_data),
    fields(request_id, doc_id = %id)
)]
#[utoipa::path(
    get, 
    path = "/api/documents/{id}/title",
    params(("id" = Uuid, Path, description = "Document ID to get the title"))
)]
pub async fn get_document_title(id: Path<Uuid>, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let id = id.into_inner();
    let app_data = app_data.into_inner();
    let res = document_service::get_document_title(id, &app_data.pool).await;

    match &res {
        Ok(title) => tracing::info!("Document title retrieved: {}", title),
        Err(err) => tracing::error!("Error: {}", &err),
    }

    Ok(HttpResponse::Ok().body(res?))
}
