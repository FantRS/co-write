use sqlx::postgres::PgConnectOptions;

use crate::core::app_error::AppResult;

pub struct AppConfig {
    pub app: AppSettings,
    pub database: DatabaseSettings,
}

impl AppConfig {
    pub fn build() -> AppResult<Self> {
        let app = AppSettings::build()?;
        let database = DatabaseSettings::build()?;

        Ok(Self { app, database })
    }
}

pub struct DatabaseSettings {
    pub username: String,
    pub password: String,
    pub port: u16,
    pub host: String,
    pub database_name: String,
}

impl DatabaseSettings {
    fn build() -> AppResult<Self> {
        let username = std::env::var("POSTGRES_USER")?;
        let password = std::env::var("POSTGRES_PASSWORD")?;
        let port = std::env::var("POSTGRES_PORT")?.parse::<u16>()?;
        let host = std::env::var("POSTGRES_HOST")?;
        let database_name = std::env::var("POSTGRES_DB")?;

        Ok(Self {
            username,
            password,
            port,
            host,
            database_name,
        })
    }

    pub fn conn(&self) -> PgConnectOptions {
        self.raw_conn().database(&self.database_name)
    }

    pub fn raw_conn(&self) -> PgConnectOptions {
        PgConnectOptions::new()
            .username(&self.username)
            .password(&self.password)
            .port(self.port)
            .host(&self.host.to_string())
    }
}

pub struct AppSettings {
    host: String,
    port: u16,
}

impl AppSettings {
    fn build() -> AppResult<Self> {
        let host = std::env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let port = std::env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());
        let port = port.parse()?;

        Ok(Self { host, port })
    }

    pub fn get_addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
