use actix_web::web::Bytes;
use actix_ws::Session;
use automerge::{AutoCommit, sync::SyncDoc};
use sqlx::PgPool;
use std::{collections::HashMap, time::Duration};
use tokio::time;
use uuid::Uuid;

use super::models::{ChangeRow, DocumentResponse, DocumentSummary, PubSubMessage};
use super::repository;
use crate::core::app_data::AppData;
use crate::app::{RequestError, RequestResult, ServiceContext};

// ─────────────────────────── Document CRUD ───────────────────────────────────

/// Створення нового документа та повернення його ідентифікатора (Uuid).
pub async fn create_document<S>(
    title: S,
    owner_id: Uuid,
    ctx: &ServiceContext<'_>,
) -> RequestResult<Uuid>
where
    S: AsRef<str>,
{
    let content = AutoCommit::new().save();
    let doc_id = repository::create(title, content, owner_id, ctx.db_pool).await?;

    // Створюємо дефолтний main.rs для нового проекту
    repository::upsert_file(
        doc_id,
        "src/main.rs",
        "fn main() {\n    println!(\"Hello, world!\");\n}",
        false,
        ctx.db_pool,
    )
    .await?;

    Ok(doc_id)
}

/// Отримання документа з бази даних за його ідентифікатором (Uuid).
pub async fn read_document(id: Uuid, ctx: &ServiceContext<'_>) -> RequestResult<Vec<u8>> {
    let row = repository::read(id, ctx.db_pool).await?;
    let response = DocumentResponse::from(row);
    Ok(response.content)
}

/// Отримання назви документа за його ідентифікатором (Uuid).
pub async fn get_document_title(id: Uuid, ctx: &ServiceContext<'_>) -> RequestResult<String> {
    repository::get_title(id, ctx.db_pool).await
}

/// Повертає список документів для користувача (власні + учасник).
pub async fn list_user_documents(
    user_id: Uuid,
    ctx: &ServiceContext<'_>,
) -> RequestResult<Vec<DocumentSummary>> {
    repository::list_for_user(user_id, ctx.db_pool).await
}

// ─────────────────────────── Project Files ───────────────────────────────────

/// Повертає всі файли проекту як HashMap<path, content>.
pub async fn get_project_files(
    doc_id: Uuid,
    ctx: &ServiceContext<'_>,
) -> RequestResult<HashMap<String, String>> {
    let rows = repository::get_all_files(doc_id, ctx.db_pool).await?;
    let map = rows
        .into_iter()
        .map(|r| (r.path, r.content))
        .collect();
    Ok(map)
}

/// Зберігає подію файлової системи у БД.
pub async fn save_fs_event(
    doc_id: Uuid,
    event: &super::models::FileSystemEvent,
    ctx: &ServiceContext<'_>,
) -> RequestResult<()> {
    use super::models::FileSystemEvent;

    match event {
        FileSystemEvent::Upsert { path, content, is_dir } => {
            repository::upsert_file(doc_id, path, content, *is_dir, ctx.db_pool).await?;
        }
        FileSystemEvent::Delete { path } => {
            repository::delete_file(doc_id, path, ctx.db_pool).await?;
        }
        FileSystemEvent::Rename { old_path, new_path } => {
            repository::rename_file(doc_id, old_path, new_path, ctx.db_pool).await?;
        }
        FileSystemEvent::Snapshot { files } => {
            for (path, content) in files {
                repository::upsert_file(doc_id, path, content, false, ctx.db_pool).await?;
            }
        }
    }

    Ok(())
}

// ─────────────────────────── Members ─────────────────────────────────────────

/// Додає учасника до проекту за username.
pub async fn add_member_by_username(
    doc_id: Uuid,
    username: &str,
    requester_id: Uuid,
    ctx: &ServiceContext<'_>,
) -> RequestResult<()> {
    // Перевіряємо що requester є власником
    let doc = repository::read(doc_id, ctx.db_pool).await?;
    if doc.owner_id != Some(requester_id) {
        return Err(RequestError::forbidden("Тільки власник може додавати учасників"));
    }

    // Знаходимо користувача
    let target = crate::app::domains::auth::repository::find_by_username(username, ctx.db_pool)
        .await?
        .ok_or_else(|| RequestError::not_found(format!("Користувача '{}' не знайдено", username)))?;

    if target.id == requester_id {
        return Err(RequestError::bad_request("Не можна додати себе як учасника"));
    }

    repository::add_member(doc_id, target.id, ctx.db_pool).await?;
    Ok(())
}

/// Видаляє учасника з проекту.
pub async fn remove_member(
    doc_id: Uuid,
    target_user_id: Uuid,
    requester_id: Uuid,
    ctx: &ServiceContext<'_>,
) -> RequestResult<()> {
    let doc = repository::read(doc_id, ctx.db_pool).await?;
    if doc.owner_id != Some(requester_id) {
        return Err(RequestError::forbidden("Тільки власник може видаляти учасників"));
    }

    repository::remove_member(doc_id, target_user_id, ctx.db_pool).await?;
    Ok(())
}

// ─────────────────────────── Export ──────────────────────────────────────────

/// Архівує файли проекту у tar.xz та повертає байти.
pub async fn export_project(doc_id: Uuid, ctx: &ServiceContext<'_>) -> RequestResult<Vec<u8>> {
    let files = get_project_files(doc_id, ctx).await?;

    let result = tokio::task::spawn_blocking(move || -> RequestResult<Vec<u8>> {
        let buf = Vec::new();
        let xz_encoder = xz2::write::XzEncoder::new(buf, 6);
        let mut tar = tar::Builder::new(xz_encoder);

        for (path, content) in &files {
            let bytes = content.as_bytes();
            let mut header = tar::Header::new_gnu();
            header.set_size(bytes.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            tar.append_data(&mut header, path, bytes)
                .map_err(|e| RequestError::internal_server_error(format!("Помилка архівування: {e}")))?;
        }

        let xz = tar.into_inner()
            .map_err(|e| RequestError::internal_server_error(format!("Помилка завершення архіву: {e}")))?;

        xz.finish()
            .map_err(|e| RequestError::internal_server_error(format!("Помилка XZ encoder: {e}")))
    })
    .await
    .map_err(|e| RequestError::internal_server_error(format!("Spawn error: {e}")))??;

    Ok(result)
}

// ─────────────────────────── Automerge sync ──────────────────────────────────

/// Обробляє вхідне бінарне повідомлення від клієнта (Automerge sync).
pub async fn apply_sync_message(
    doc_id: Uuid,
    conn_id: Uuid,
    change: Bytes,
    ctx: &ServiceContext<'_>,
) -> RequestResult<()> {
    automerge::sync::Message::decode(change.as_ref()).map_err(|err| {
        tracing::error!("Не вдалося декодувати повідомлення синхронізації: {err:?}");
        crate::app::RequestError::bad_request("Неправильний формат повідомлення Automerge")
    })?;

    repository::push_change_in_db(doc_id, change.clone(), ctx.db_pool).await?;

    let pubsub_msg = PubSubMessage::SyncChange {
        sender_conn_id: conn_id,
        change: change.to_vec(),
    };
    if let Ok(serialized) = serde_json::to_vec(&pubsub_msg) {
        let channel_name = format!("document:room:{}", doc_id);
        let _ = ctx.redis.publish(&channel_name, serialized).await;
    }

    Ok(())
}

/// Надсилання нещодавніх Automerge змін новому учаснику.
pub async fn send_existing_changes(
    doc_id: Uuid,
    session: &mut Session,
    ctx: &ServiceContext<'_>,
) -> RequestResult<()> {
    let changes = repository::get_change(doc_id, ctx.db_pool).await?;

    for change in changes {
        if let Err(err) = session.binary(Bytes::from(change.update)).await {
            tracing::warn!("Клієнт відключився під час надсилання змін: {err}");
            break;
        }
    }

    Ok(())
}

/// Запуск фонового процесу злиття змін до документа кожні 5 хвилин.
pub fn run_merge(id: Uuid, app_data: &AppData) {
    let interval_secs = crate::constants::document::MERGE_INTERVAL_SECONDS;
    let cancel_token = app_data.token().child_token();
    let (pool, rooms) = app_data.get_data();
    let interval = Duration::from_secs(interval_secs);

    actix_rt::spawn(async move {
        tracing::info!("Запущено фоновий демон злиття змін для документа {id}");

        while !cancel_token.is_cancelled() {
            tokio::select! {
                _ = cancel_token.cancelled() => {
                    if let Err(err) = merge_changes(id, &pool).await {
                        tracing::error!("Помилка фонового злиття змін для {id}: {err:?}");
                    }
                    tracing::info!("Зупинка демона злиття для {id} (скасовано)");
                    break;
                }
                _ = time::sleep(interval) => {
                    if let Err(err) = merge_changes(id, &pool).await {
                        tracing::error!("Помилка фонового злиття змін для {id}: {err:?}");
                    }
                    if rooms.is_empty(&id) {
                        tracing::info!("Зупинка демона злиття для {id}");
                        break;
                    }
                }
            }
        }
    });
}

async fn merge_changes(doc_id: Uuid, pool: &PgPool) -> RequestResult<()> {
    let mut tx = pool.begin().await?;

    let doc_row = repository::read_for_update(doc_id, &mut *tx).await?;
    let changes_data = repository::get_change(doc_id, &mut *tx).await?;
    if changes_data.is_empty() {
        tracing::debug!("Немає нових змін для {doc_id}");
        tx.commit().await?;
        return Ok(());
    }

    let mut doc = AutoCommit::load(&doc_row.content)?;
    let (ids, changes_bytes) = ChangeRow::split_data(changes_data);
    let mut state = automerge::sync::State::new();

    for bin in changes_bytes {
        let message = automerge::sync::Message::decode(&bin)?;
        doc.sync().receive_sync_message(&mut state, message)?
    }

    repository::update(doc_id, doc.save(), &mut *tx).await?;
    repository::delete_changes(ids, &mut *tx).await?;

    tx.commit().await?;
    tracing::info!("Зміни для {doc_id} успішно об'єднані та збережені");

    Ok(())
}
