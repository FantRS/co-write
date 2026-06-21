# Етап 1: Підготовка рецепта (Planner)
FROM lukemathwalker/cargo-chef:latest-rust-1.85 AS chef
WORKDIR /usr/src/app

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
FROM rust:1.85-slim AS ra-builder
RUN rustup component add rust-analyzer \
    && cp $(rustup which rust-analyzer) /usr/local/bin/rust-analyzer-real

# Етап 4: Фінальний образ (Runtime)
FROM rust:1.85-slim AS runtime

WORKDIR /app

RUN rustup component add rustfmt
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    util-linux \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ra-builder /usr/local/bin/rust-analyzer-real /usr/local/bin/rust-analyzer
COPY --from=ra-builder /usr/local/rustup/toolchains/1.85.1-x86_64-unknown-linux-gnu/lib/ /usr/local/rustup-libs/
ENV LD_LIBRARY_PATH=/usr/local/rustup-libs
RUN /usr/local/bin/rust-analyzer --version
RUN groupadd -g 2000 sandbox && useradd -u 2000 -g 2000 -M -s /usr/sbin/nologin sandbox

COPY --from=builder /usr/src/app/target/release/server /app/server
COPY --from=builder /usr/src/app/migrations /app/migrations

EXPOSE 8080

CMD ["/app/server"]
