# Етап 1: Підготовка рецепта (Planner)
FROM lukemathwalker/cargo-chef:latest-rust-1.85 AS chef
WORKDIR /usr/src/app

# Обмежуємо кількість паралельних потоків компіляції Rust.
# Оскільки Docker-демону виділено 12 ядер процесора, але лише ~3.7 ГБ RAM,
# cargo намагається запустити 12 процесів rustc паралельно, що повністю вичерпує пам'ять
# і призводить до жорсткого зависання системи (thrashing/swapping) або OOM.
# Ліміт у 2 потоки забезпечує стабільну збірку.
ENV CARGO_BUILD_JOBS=2

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Етап 2: Збірка залежностей (Cacher)
FROM chef AS cacher
COPY --from=planner /usr/src/app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Етап 3: Збірка проекту (Builder)
FROM chef AS builder
COPY . .
COPY --from=cacher /usr/src/app/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME
RUN cargo build --release

# Етап 3.5: Збірка справжнього rust-analyzer бінарного файлу
# Потрібно встановити компонент так, щоб він дав реальний ELF-бінарний файл,
# а не rustup-stub (який є символічним посиланням на rustup і повертає помилку
# "Unknown binary 'rust-analyzer' in official toolchain").
FROM rust:1.85-slim AS ra-builder
RUN rustup component add rust-analyzer \
    && cp $(rustup which rust-analyzer) /usr/local/bin/rust-analyzer-real

# Етап 4: Фінальний образ (Runtime)
# Зверніть увагу: ми використовуємо rust:1.85-slim замість debian,
# оскільки для роботи нашого IDE-ендпоінту `execution_service.rs`
# потрібен встановлений компілятор `rustc`!
FROM rust:1.85-slim AS runtime

WORKDIR /app

# Встановлюємо необхідні компоненти Rust (rustfmt)
RUN rustup component add rustfmt

# Встановлюємо залежності (можливо потрібні для роботи SSL чи БД, а також util-linux для prlimit)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    util-linux \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо справжній rust-analyzer (реальний ELF-бінарний файл, не rustup-stub)
COPY --from=ra-builder /usr/local/bin/rust-analyzer-real /usr/local/bin/rust-analyzer

# Копіюємо директорію бібліотек rust-analyzer (librustc_driver, libLLVM)
# Зберігаємо оригінальну структуру, щоб ldconfig не мав проблем з нестандартними назвами
COPY --from=ra-builder /usr/local/rustup/toolchains/1.85.1-x86_64-unknown-linux-gnu/lib/ /usr/local/rustup-libs/

# Налаштовуємо LD_LIBRARY_PATH для пошуку динамічних бібліотек rust-analyzer
ENV LD_LIBRARY_PATH=/usr/local/rustup-libs

# Перевіряємо що rust-analyzer запускається
RUN /usr/local/bin/rust-analyzer --version

# Створюємо ізольованого unprivileged користувача sandbox для безпечного запуску коду
RUN groupadd -g 2000 sandbox && useradd -u 2000 -g 2000 -M -s /usr/sbin/nologin sandbox

COPY --from=builder /usr/src/app/target/release/server /app/server
COPY --from=builder /usr/src/app/migrations /app/migrations

# Expose port
EXPOSE 8080

# Start server
CMD ["/app/server"]
