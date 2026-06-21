use anyhow::Result;
use serde::Deserialize;
use serde_with::{DisplayFromStr, serde_as};
use sqlx::postgres::PgConnectOptions;

/// Головна конфігурація додатка.
#[derive(Deserialize, Clone)]
pub struct AppConfig {
    #[serde(flatten)]
    pub app: AppSettings,

    #[serde(flatten)]
    pub postgres: PostgresSettings,

    #[serde(flatten)]
    pub redis: RedisSettings,

    #[serde(flatten)]
    pub jwt: JwtSettings,
}

impl AppConfig {
    /// Завантажує та будує конфігурацію зі змінних середовища.
    pub fn configure() -> Result<Self> {
        let config = config::Config::builder()
            .add_source(config::Environment::default())
            .build()?;


        config.try_deserialize().map_err(From::from)
    }
}

/// Налаштування веб-сервера.
#[serde_as]
#[derive(Deserialize, Clone)]
pub struct AppSettings {
    #[serde(rename = "server_host")]
    pub host: String,

    #[serde_as(as = "DisplayFromStr")]
    #[serde(rename = "server_port")]
    pub port: u16,
}

impl AppSettings {
    /// Повертає повну адресу сервера (host:port).
    pub fn addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

/// Налаштування підключення до PostgreSQL.
#[serde_as]
#[derive(Deserialize, Clone)]
pub struct PostgresSettings {
    #[serde(rename = "postgres_user")]
    pub user: String,

    #[serde(rename = "postgres_password")]
    pub password: String,

    #[serde(rename = "postgres_host")]
    pub host: String,

    #[serde_as(as = "DisplayFromStr")]
    #[serde(rename = "postgres_port")]
    pub port: u16,

    #[serde(rename = "postgres_db")]
    pub db_name: String,
}

impl PostgresSettings {
    /// Повертає параметри підключення до PostgreSQL.
    pub fn options(&self) -> PgConnectOptions {
        PgConnectOptions::new()
            .username(&self.user)
            .password(&self.password)
            .host(&self.host)
            .port(self.port)
            .database(&self.db_name)
    }
}

/// Налаштування підключення до Redis.
#[serde_as]
#[derive(Deserialize, Clone)]
pub struct RedisSettings {
    #[serde(rename = "redis_host")]
    pub host: String,

    #[serde_as(as = "DisplayFromStr")]
    #[serde(rename = "redis_port")]
    pub port: u16,

    #[serde(default)]
    #[serde(rename = "redis_password")]
    pub pass: String,
}

impl RedisSettings {
    /// Повертає адресу підключення до Redis (redis://...).
    pub fn addr(&self) -> String {
        if self.pass.is_empty() {
            format!("redis://{}:{}", self.host, self.port)
        } else {
            format!("redis://:{}@{}:{}", self.pass, self.host, self.port)
        }
    }
}

/// Налаштування JWT.
#[derive(Deserialize, Clone)]
pub struct JwtSettings {
    #[serde(rename = "jwt_secret")]
    pub secret: String,
}
