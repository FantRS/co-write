use actix_web::{
    http::{header::ContentType, StatusCode},
    HttpResponse, ResponseError,
};

pub type RequestResult<T> = Result<T, RequestError>;

#[derive(Debug, thiserror::Error)]
pub enum RequestError {
    /// 400 Bad Request
    #[error("400 Bad Request. Контекст: {0}")]
    BadRequest(String),

    /// 401 Unauthorized
    #[error("401 Unauthorized. Контекст: {0}")]
    Unauthorized(String),

    /// 403 Forbidden
    #[error("403 Forbidden. Контекст: {0}")]
    Forbidden(String),

    /// 404 Not Found
    #[error("404 Not Found. Контекст: {0}")]
    NotFound(String),

    /// 409 Conflict
    #[error("409 Conflict. Контекст: {0}")]
    Conflict(String),

    /// 422 Unprocessable Entity
    #[error("422 Unprocessable Entity. Контекст: {0}")]
    UnprocessableEntity(String),

    /// 500 Internal Server Error
    #[error("500 Internal Server Error. Контекст: {0}")]
    InternalServerError(String),

    /// 503 Service Unavailable
    #[error("503 Service Unavailable. Контекст: {0}")]
    ServiceUnavailable(String),
}

impl RequestError {
    /// Повідомлення, яке бачить кінцевий користувач
    fn user_message(&self) -> String {
        match self {
            RequestError::BadRequest(_) => "[400] Неправильний формат запиту".to_string(),
            RequestError::Unauthorized(_) => "[401] Потрібна автентифікація".to_string(),
            RequestError::Forbidden(_) => "[403] Доступ заборонено".to_string(),
            RequestError::NotFound(_) => "[404] Ресурс не знайдено".to_string(),
            RequestError::Conflict(_) => "[409] Конфлікт ресурсу".to_string(),
            RequestError::UnprocessableEntity(_) => "[422] Неприпустима сутність".to_string(),
            RequestError::InternalServerError(_) => "[500] Внутрішня помилка сервера".to_string(),
            RequestError::ServiceUnavailable(_) => "[503] Сервіс недоступний".to_string(),
        }
    }

    /// 400 Bad Request
    pub fn bad_request(msg: impl Into<String>) -> Self {
        RequestError::BadRequest(msg.into())
    }

    /// 401 Unauthorized
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        RequestError::Unauthorized(msg.into())
    }

    /// 403 Forbidden
    pub fn forbidden(msg: impl Into<String>) -> Self {
        RequestError::Forbidden(msg.into())
    }

    /// 404 Not Found
    pub fn not_found(msg: impl Into<String>) -> Self {
        RequestError::NotFound(msg.into())
    }

    /// 409 Conflict
    pub fn conflict(msg: impl Into<String>) -> Self {
        RequestError::Conflict(msg.into())
    }

    /// 422 Unprocessable Entity
    pub fn unprocessable_entity(msg: impl Into<String>) -> Self {
        RequestError::UnprocessableEntity(msg.into())
    }

    /// 500 Internal Server Error
    pub fn internal_server_error(msg: impl Into<String>) -> Self {
        RequestError::InternalServerError(msg.into())
    }

    /// 503 Service Unavailable
    pub fn service_unavailable(msg: impl Into<String>) -> Self {
        RequestError::ServiceUnavailable(msg.into())
    }
}

impl ResponseError for RequestError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .insert_header(ContentType::plaintext())
            .body(self.user_message())
    }

    fn status_code(&self) -> StatusCode {
        match *self {
            RequestError::BadRequest(_) => StatusCode::BAD_REQUEST,
            RequestError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            RequestError::Forbidden(_) => StatusCode::FORBIDDEN,
            RequestError::NotFound(_) => StatusCode::NOT_FOUND,
            RequestError::Conflict(_) => StatusCode::CONFLICT,
            RequestError::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
            RequestError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            RequestError::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
        }
    }
}

impl From<sqlx::Error> for RequestError {
    fn from(error: sqlx::Error) -> Self {
        match &error {
            sqlx::Error::RowNotFound => RequestError::NotFound(error.to_string()),
            sqlx::Error::Database(db_error) => {
                let db_code = db_error.code().unwrap_or_default();
                let error_message = db_error.message();

                match db_code.as_ref() {
                    "23502" => RequestError::BadRequest(format!("Порушення обмеження NOT NULL: {}", error_message)),
                    "23503" => RequestError::BadRequest(format!("Порушення обмеження зовнішнього ключа (Foreign key): {}", error_message)),
                    "23505" => RequestError::Conflict(format!("Порушення обмеження унікальності (Unique constraint): {}", error_message)),
                    _ => RequestError::InternalServerError(format!("Помилка бази даних [{}]: {}", db_code, error_message)),
                }
            }
            sqlx::Error::PoolTimedOut => {
                RequestError::ServiceUnavailable("Таймаут пулу підключень до бази даних".to_string())
            }
            _ => RequestError::InternalServerError(error.to_string()),
        }
    }
}

impl From<actix_ws::Closed> for RequestError {
    fn from(error: actix_ws::Closed) -> Self {
        Self::NotFound(error.to_string())
    }
}

impl From<uuid::Error> for RequestError {
    fn from(error: uuid::Error) -> Self {
        Self::BadRequest(error.to_string())
    }
}

macro_rules! impl_from {
    ( $e_type:ty ) => {
        impl From<$e_type> for RequestError {
            fn from(error: $e_type) -> Self {
                Self::InternalServerError(error.to_string())
            }
        }
    };
    ( $e_type:ty, $variant:ident ) => {
        impl From<$e_type> for RequestError {
            fn from(error: $e_type) -> Self {
                Self::$variant(error.to_string())
            }
        }
    };
}

impl_from!(std::env::VarError);
impl_from!(std::io::Error);
impl_from!(actix_web::Error);
impl_from!(automerge::AutomergeError);
impl_from!(automerge::sync::ReadMessageError);
impl_from!(automerge::LoadChangeError);
impl_from!(std::num::ParseIntError);
