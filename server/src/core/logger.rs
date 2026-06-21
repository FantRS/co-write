use tracing_subscriber::{
    EnvFilter, Registry, layer::SubscriberExt, util::SubscriberInitExt,
};

/// Рівні логування для системи логування.
pub enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
    Trace,
}

impl From<LogLevel> for EnvFilter {
    fn from(value: LogLevel) -> Self {
        match value {
            LogLevel::Error => "error".into(),
            LogLevel::Warn => "warning".into(),
            LogLevel::Info => "info".into(),
            LogLevel::Debug => "debug".into(),
            LogLevel::Trace => "trace".into(),
        }
    }
}

/// Ініціалізує систему логування з вибраним рівнем фільтрації та красивим, зрозумілим для людини (human-readable) виводом.
pub fn init_logger(level: LogLevel) {
    let settings_layer = tracing_subscriber::fmt::layer()
        .with_level(true)
        .with_target(false)
        .with_ansi(true);

    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| level.into());

    Registry::default()
        .with(settings_layer)
        .with(env_filter)
        .init();
}
