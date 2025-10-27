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
pub async fn create_document(title: String, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let app_data = app_data.into_inner();
    
    match document_service::create_document(title, &app_data.pool).await {
        Ok(id) => {
            tracing::info!("створено документ з Uuid: {}", &id);
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
pub async fn get_document(id: Path<Uuid>, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let id = id.into_inner();
    let app_data = app_data.into_inner();
    match document_service::read_document(id, &app_data.pool).await {
        Ok(document) => {
            tracing::info!("документ успішно отриманий з бази данних");
            Ok(HttpResponse::Ok().json(document))
        },
        Err(err) => {
            tracing::error!("Помилка: {}", &err);
            Err(err)
        }
    }
}
