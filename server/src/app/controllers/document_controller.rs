use actix_web::{web::{Data, Path}, HttpResponse, Responder};

use crate::{
    app::services::document_service, app_data::{AppData}, app_error::AppResult
};

pub async fn create_document(title: String, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let app_data = app_data.into_inner();
    let id = document_service::create_document(title, &app_data.pool).await?;

    Ok(HttpResponse::Ok().body(id.to_string()))
}

pub async fn get_document(id: Path<String>, app_data: Data<AppData>) -> AppResult<impl Responder> {
    let id = id.into_inner();
    let app_data = app_data.into_inner();
    let document = document_service::read_document(id, &app_data.pool).await?;

    Ok(HttpResponse::Ok().json(document))
}
