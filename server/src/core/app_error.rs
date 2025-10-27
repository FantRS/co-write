use actix_web::{
    HttpResponse, ResponseError,
    http::{StatusCode, header::ContentType},
};

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("400 Bad Request")]
    BadRequest,

    #[error("401 Unauthorized")]
    Unauthorized,

    #[error("403 Forbidden")]
    Forbidden,

    #[error("404 Not Found")]
    NotFound,

    #[error("405 Method Not Allowed")]
    MethodNotAllowed,

    #[error("409 Conflict")]
    Conflict,

    #[error("422 Unprocessable Entity")]
    UnprocessableEntity,

    #[error("500 Internal Server Error")]
    InternalServer(String),

    #[error("501 Not Implemented")]
    NotImplemented,

    #[error("502 Bad Gateway")]
    BadGateway,

    #[error("503 Service Unavailable")]
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

            AppError::InternalServer(_) => StatusCode::INTERNAL_SERVER_ERROR,
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
                    _ => AppError::InternalServer(db_error.to_string()),
                }
            }
            _ => AppError::InternalServer(error.to_string()),
        }
    }
}

impl From<uuid::Error> for AppError {
    fn from(_: uuid::Error) -> Self {
        Self::BadRequest
    }
}

macro_rules! impl_from {
    ( $e_type:ty ) => {
        impl From<$e_type> for AppError {
            fn from(error: $e_type) -> Self {
                Self::InternalServer(error.to_string())
            }
        }
    };
}

impl_from!(std::env::VarError);
impl_from!(std::io::Error);
impl_from!(actix_web::Error);
