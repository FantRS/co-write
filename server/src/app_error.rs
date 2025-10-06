use actix_web::{
    HttpResponse, ResponseError,
    http::{StatusCode, header::ContentType},
};

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("400 Bad Request [rost]")]
    BadRequest,

    #[error("401 Unauthorized [rost]")]
    Unauthorized,

    #[error("403 Forbidden [rost]")]
    Forbidden,

    #[error("404 Not Found [rost]")]
    NotFound,

    #[error("405 Method Not Allowed [rost]")]
    MethodNotAllowed,

    #[error("409 Conflict [rost]")]
    Conflict,

    #[error("422 Unprocessable Entity [rost]")]
    UnprocessableEntity,

    #[error("500 Internal Server Error [rost]")]
    InternalServerError,

    #[error("501 Not Implemented [rost]")]
    NotImplemented,

    #[error("502 Bad Gateway [rost]")]
    BadGateway,

    #[error("503 Service Unavailable [rost]")]
    ServiceUnavailable,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .insert_header(ContentType::plaintext())
            .body(self.to_string())
    }

    fn status_code(&self) -> StatusCode {
        match *self {
            AppError::BadRequest => StatusCode::BAD_REQUEST,
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Forbidden => StatusCode::FORBIDDEN,
            AppError::NotFound => StatusCode::NOT_FOUND,
            AppError::MethodNotAllowed => StatusCode::METHOD_NOT_ALLOWED,
            AppError::Conflict => StatusCode::CONFLICT,
            AppError::UnprocessableEntity => StatusCode::UNPROCESSABLE_ENTITY,

            AppError::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::NotImplemented => StatusCode::NOT_IMPLEMENTED,
            AppError::BadGateway => StatusCode::BAD_GATEWAY,
            AppError::ServiceUnavailable => StatusCode::SERVICE_UNAVAILABLE,
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        match error {
            sqlx::Error::RowNotFound => AppError::NotFound,
            sqlx::Error::Database(db_error) => {
                let db_code = db_error.code().unwrap_or_default();

                match db_code.as_ref() {
                    "23502" => AppError::BadRequest, // спроба впихнути NULL
                    "23503" => AppError::BadRequest, // неіснуючий елемент
                    "23505" => AppError::Conflict,   // дублікат значення
                    _ => AppError::InternalServerError,
                }
            }
            _ => AppError::InternalServerError,
        }
    }
}

impl From<std::env::VarError> for AppError {
    fn from(_: std::env::VarError) -> Self {
        Self::InternalServerError
    }
}

impl From<std::io::Error> for AppError {
    fn from(_: std::io::Error) -> Self {
        Self::InternalServerError
    }
}
