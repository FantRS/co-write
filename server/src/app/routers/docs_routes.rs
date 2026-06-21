use actix_web::web::ServiceConfig;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::api_doc::ApiDoc;

/// Налаштовує ендпоінт для Swagger UI документації API.
pub fn swagger_ui(config: &mut ServiceConfig) {
    config.service(
        SwaggerUi::new("/swagger-ui/{_:.*}").url("/api-docs/openapi.json", ApiDoc::openapi()),
    );
}
