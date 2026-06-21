use actix_web::{web, HttpResponse, Responder};

use super::models::{LoginRequest, RegisterRequest};
use super::service;
use crate::core::app_data::AppData;
use crate::app::{RequestResult, ServiceContext};

/// Реєстрація нового користувача.
///
/// Повертає JWT-токен при успішній реєстрації.
#[tracing::instrument(name = "register", skip(app_data, req), fields(username = %req.username))]
pub async fn register(
    req: web::Json<RegisterRequest>,
    app_data: web::Data<AppData>,
) -> RequestResult<impl Responder> {
    let ctx = ServiceContext::from(app_data.get_ref());
    let jwt_secret = &app_data.jwt_secret;
    let resp = service::register(req.into_inner(), jwt_secret, &ctx).await?;
    Ok(HttpResponse::Created().json(resp))
}

/// Вхід до системи.
///
/// Повертає JWT-токен при успішній автентифікації.
#[tracing::instrument(name = "login", skip(app_data, req), fields(username = %req.username))]
pub async fn login(
    req: web::Json<LoginRequest>,
    app_data: web::Data<AppData>,
) -> RequestResult<impl Responder> {
    let ctx = ServiceContext::from(app_data.get_ref());
    let jwt_secret = &app_data.jwt_secret;
    let resp = service::login(req.into_inner(), jwt_secret, &ctx).await?;
    Ok(HttpResponse::Ok().json(resp))
}
