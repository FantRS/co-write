use tracing_subscriber::{
    EnvFilter, Registry, fmt::Layer, layer::SubscriberExt, util::SubscriberInitExt,
};

pub fn init_logger<S>(default_level: S)
where
    S: AsRef<str>,
{
    let settings_layer = Layer::new()
        .with_level(true)
        .with_target(false)
        .json()
        .with_span_list(false);

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(default_level.as_ref()));

    Registry::default()
        .with(settings_layer)
        .with(env_filter)
        .init();
}
