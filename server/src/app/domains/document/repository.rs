use actix_web::web::Bytes;
use sqlx::PgExecutor;
use uuid::Uuid;

use super::models::{DocumentRow, ChangeRow, ProjectFileRow, DocumentSummary, SessionRole};
use crate::app::RequestResult;

// ─────────────────────────── Documents ───────────────────────────────────────

/// Створює новий запис документа в базі даних.
pub async fn create<'c, S, I, E>(title: S, content: I, owner_id: Uuid, executor: E) -> RequestResult<Uuid>
where
    S: AsRef<str>,
    I: IntoIterator<Item = u8>,
    E: PgExecutor<'c>,
{
    let id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO documents (title, content, owner_id) 
            VALUES ($1, $2, $3) 
            RETURNING id",
    )
    .bind(title.as_ref())
    .bind(content.into_iter().collect::<Vec<u8>>())
    .bind(owner_id)
    .fetch_one(executor)
    .await?;

    Ok(id)
}

/// Зчитує документ за його унікальним Uuid.
pub async fn read<'c, E>(id: Uuid, executor: E) -> RequestResult<DocumentRow>
where
    E: PgExecutor<'c>,
{
    let row = sqlx::query_as::<_, DocumentRow>(
        "SELECT id, title, content, owner_id, updated_at 
            FROM documents 
            WHERE id = $1",
    )
    .bind(id)
    .fetch_one(executor)
    .await?;

    Ok(row)
}

/// Зчитує документ та блокує його рядок у БД за допомогою FOR UPDATE.
pub async fn read_for_update<'c, E>(id: Uuid, executor: E) -> RequestResult<DocumentRow>
where
    E: PgExecutor<'c>,
{
    let row = sqlx::query_as::<_, DocumentRow>(
        "SELECT id, title, content, owner_id, updated_at 
            FROM documents 
            WHERE id = $1 
            FOR UPDATE",
    )
    .bind(id)
    .fetch_one(executor)
    .await?;

    Ok(row)
}

/// Отримує назву документа за його унікальним Uuid.
pub async fn get_title<'c, E>(id: Uuid, executor: E) -> RequestResult<String>
where
    E: PgExecutor<'c>,
{
    let title = sqlx::query_scalar::<_, String>(
        "SELECT title FROM documents WHERE id = $1",
    )
    .bind(id)
    .fetch_one(executor)
    .await?;

    Ok(title)
}

/// Оновлює вміст (snapshot) документа та час останнього оновлення.
pub async fn update<'c, I, E>(id: Uuid, content: I, executor: E) -> RequestResult<()>
where
    I: IntoIterator<Item = u8>,
    E: PgExecutor<'c>,
{
    sqlx::query(
        "UPDATE documents SET content = $2, updated_at = NOW() WHERE id = $1",
    )
    .bind(id)
    .bind(content.into_iter().collect::<Vec<u8>>())
    .execute(executor)
    .await?;

    Ok(())
}

/// Повертає всі документи, де користувач є власником або учасником.
pub async fn list_for_user<'c, E>(user_id: Uuid, executor: E) -> RequestResult<Vec<DocumentSummary>>
where
    E: PgExecutor<'c>,
{
    let rows = sqlx::query_as::<_, DocumentSummary>(
        "SELECT d.id, d.title, d.updated_at, d.owner_id,
                u.username AS owner_username,
                CASE WHEN d.owner_id = $1 THEN true ELSE false END AS is_owner
         FROM documents d
         JOIN users u ON u.id = d.owner_id
         WHERE d.owner_id = $1
            OR EXISTS (SELECT 1 FROM document_members dm WHERE dm.document_id = d.id AND dm.user_id = $1)
         ORDER BY d.updated_at DESC"
    )
    .bind(user_id)
    .fetch_all(executor)
    .await?;

    Ok(rows)
}

/// Видаляє накопичені оновлення за списком їх Uuid.
pub async fn delete_changes<'c, I, E>(ids: I, executor: E) -> RequestResult<()>
where
    I: IntoIterator<Item = Uuid>,
    E: PgExecutor<'c>,
{
    sqlx::query("DELETE FROM document_updates WHERE id = ANY($1)")
        .bind(ids.into_iter().collect::<Vec<Uuid>>())
        .execute(executor)
        .await?;

    Ok(())
}

/// Зберігає нове бінарне оновлення (change) для документа в базу даних.
pub async fn push_change_in_db<'c, E>(id: Uuid, change: Bytes, executor: E) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query(
        "INSERT INTO document_updates (document_id, update) VALUES ($1, $2)",
    )
    .bind(id)
    .bind(change.as_ref().to_vec())
    .execute(executor)
    .await?;

    Ok(())
}

/// Отримує всі збережені бінарні оновлення (changes) для документа, відсортовані за часом.
pub async fn get_change<'c, E>(id: Uuid, executor: E) -> RequestResult<Vec<ChangeRow>>
where
    E: PgExecutor<'c>,
{
    let res = sqlx::query_as::<_, ChangeRow>(
        "SELECT id, update FROM document_updates WHERE document_id = $1 ORDER BY created_at ASC",
    )
    .bind(id)
    .fetch_all(executor)
    .await?;

    Ok(res)
}

// ─────────────────────────── Project Files ────────────────────────────────────

/// Повертає всі файли проекту з бази даних.
pub async fn get_all_files<'c, E>(doc_id: Uuid, executor: E) -> RequestResult<Vec<ProjectFileRow>>
where
    E: PgExecutor<'c>,
{
    let rows = sqlx::query_as::<_, ProjectFileRow>(
        "SELECT id, path, content, is_dir FROM project_files WHERE document_id = $1 ORDER BY path"
    )
    .bind(doc_id)
    .fetch_all(executor)
    .await?;

    Ok(rows)
}

/// Вставляє або оновлює файл проекту (upsert).
pub async fn upsert_file<'c, E>(
    doc_id: Uuid,
    path: &str,
    content: &str,
    is_dir: bool,
    executor: E,
) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query(
        "INSERT INTO project_files (document_id, path, content, is_dir, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (document_id, path) DO UPDATE
         SET content = EXCLUDED.content, is_dir = EXCLUDED.is_dir, updated_at = NOW()"
    )
    .bind(doc_id)
    .bind(path)
    .bind(content)
    .bind(is_dir)
    .execute(executor)
    .await?;

    Ok(())
}

/// Видаляє файл проекту за шляхом.
pub async fn delete_file<'c, E>(doc_id: Uuid, path: &str, executor: E) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query(
        "DELETE FROM project_files WHERE document_id = $1 AND (path = $2 OR path LIKE $3)"
    )
    .bind(doc_id)
    .bind(path)
    .bind(format!("{}/", path) + "%")
    .execute(executor)
    .await?;

    Ok(())
}

/// Перейменовує файл або директорію проекту.
pub async fn rename_file<'c, E>(
    doc_id: Uuid,
    old_path: &str,
    new_path: &str,
    executor: E,
) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    // Перейменовуємо сам файл/директорію та всі вкладені шляхи
    sqlx::query(
        "UPDATE project_files
         SET path = $3 || SUBSTRING(path FROM LENGTH($2) + 1), updated_at = NOW()
         WHERE document_id = $1 AND (path = $2 OR path LIKE $4)"
    )
    .bind(doc_id)
    .bind(old_path)
    .bind(new_path)
    .bind(format!("{}/", old_path) + "%")
    .execute(executor)
    .await?;

    Ok(())
}

// ─────────────────────────── Members ─────────────────────────────────────────

/// Додає учасника до проекту за user_id.
pub async fn add_member<'c, E>(doc_id: Uuid, user_id: Uuid, executor: E) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query(
        "INSERT INTO document_members (document_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
    )
    .bind(doc_id)
    .bind(user_id)
    .execute(executor)
    .await?;

    Ok(())
}

/// Видаляє учасника з проекту.
pub async fn remove_member<'c, E>(doc_id: Uuid, user_id: Uuid, executor: E) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query("DELETE FROM document_members WHERE document_id = $1 AND user_id = $2")
        .bind(doc_id)
        .bind(user_id)
        .execute(executor)
        .await?;

    Ok(())
}

/// Повертає збережену роль учасника документа. None — якщо не є членом.
pub async fn get_member_role<'c, E>(doc_id: Uuid, user_id: Uuid, executor: E) -> RequestResult<Option<SessionRole>>
where
    E: PgExecutor<'c>,
{
    let role_str = sqlx::query_scalar::<_, String>(
        "SELECT role FROM document_members WHERE document_id = $1 AND user_id = $2"
    )
    .bind(doc_id)
    .bind(user_id)
    .fetch_optional(executor)
    .await?;

    let role = role_str.map(|r| match r.as_str() {
        "editor"  => SessionRole::Editor,
        "manager" => SessionRole::Manager,
        _         => SessionRole::Reader,
    });

    Ok(role)
}

/// Оновлює роль учасника документа в БД.
pub async fn set_member_role<'c, E>(doc_id: Uuid, user_id: Uuid, role: &str, executor: E) -> RequestResult<()>
where
    E: PgExecutor<'c>,
{
    sqlx::query(
        "UPDATE document_members SET role = $3 WHERE document_id = $1 AND user_id = $2"
    )
    .bind(doc_id)
    .bind(user_id)
    .bind(role)
    .execute(executor)
    .await?;

    Ok(())
}
