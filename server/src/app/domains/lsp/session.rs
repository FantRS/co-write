use std::{
    collections::HashMap,
    path::PathBuf,
    process::Stdio,
    sync::{
        atomic::{AtomicU32, Ordering},
        Arc,
    },
    time::Instant,
};

use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tempfile::TempDir;
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    process::{Child, ChildStdin, Command},
    sync::{oneshot, Mutex},
};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::app::{RequestError, RequestResult};

// ─────────────────────────── LSP types ───────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct LspCompletionItem {
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub documentation: Option<String>,
    /// LSP CompletionItemKind: 1=Text,2=Method,3=Function,4=Constructor,5=Field,
    /// 6=Variable,7=Class,8=Interface,9=Module,10=Property,14=Keyword,
    /// 15=Snippet,22=Struct,23=Event,24=Operator,25=TypeParameter
    pub kind: u8,
    #[serde(rename = "insertText", skip_serializing_if = "Option::is_none")]
    pub insert_text: Option<String>,
    /// 1=PlainText, 2=Snippet
    #[serde(rename = "insertTextFormat", skip_serializing_if = "Option::is_none")]
    pub insert_text_format: Option<u8>,
}

// ─────────────────────────── LSP Session ─────────────────────────────────────

/// Сесія `rust-analyzer` для одного документа.
/// Зберігає запущений процес, тимчасову директорію та канали зв'язку.
pub struct LspSession {
    /// Stdin процесу rust-analyzer (захищений Mutex для послідовних запитів)
    stdin: Mutex<ChildStdin>,
    /// Очікувані відповіді: request_id → oneshot sender
    pending: Arc<DashMap<u32, oneshot::Sender<Value>>>,
    /// Лічильник ідентифікаторів запитів
    next_id: AtomicU32,
    /// Тимчасова директорія з файлами проекту
    _temp_dir: TempDir,
    /// Шлях до тимчасової директорії (для синхронізації файлів)
    pub dir_path: PathBuf,
    /// Хеш файлів, що були записані останнього разу (для інкрементальної синхронізації)
    pub files_hash: Mutex<HashMap<String, u64>>,
    /// Час останнього використання (для TTL-очищення)
    pub last_used: Mutex<Instant>,
    /// Дочірній процес (зберігаємо для drop)
    _child: Mutex<Child>,
    /// Відкриті файли в rust-analyzer
    pub opened_files: Mutex<std::collections::HashSet<String>>,
    /// Версії відкритих файлів для didChange
    pub file_versions: Mutex<HashMap<String, u32>>,
}

impl LspSession {
    /// Надсилає JSON-RPC повідомлення через stdin rust-analyzer.
    pub async fn send(&self, msg: Value) -> RequestResult<()> {
        let body = serde_json::to_vec(&msg).unwrap();
        let header = format!("Content-Length: {}\r\n\r\n", body.len());
        let mut stdin = self.stdin.lock().await;
        stdin.write_all(header.as_bytes()).await.map_err(|e| {
            tracing::error!("Помилка запису заголовку LSP: {e}");
            RequestError::internal_server_error("Помилка зв'язку з rust-analyzer")
        })?;
        stdin.write_all(&body).await.map_err(|e| {
            tracing::error!("Помилка запису тіла LSP: {e}");
            RequestError::internal_server_error("Помилка зв'язку з rust-analyzer")
        })?;
        stdin.flush().await.map_err(|e| {
            tracing::error!("Помилка flush stdin LSP: {e}");
            RequestError::internal_server_error("Помилка зв'язку з rust-analyzer")
        })?;
        Ok(())
    }

    /// Надсилає JSON-RPC запит і чекає на відповідь.
    pub async fn request(&self, method: &str, params: Value) -> RequestResult<Value> {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        let msg = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": method,
            "params": params,
        });

        let (tx, rx) = oneshot::channel();
        self.pending.insert(id, tx);
        self.send(msg).await?;

        // Чекаємо відповідь з таймаутом 30 секунд (для надійного холодного старту)
        match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
            Ok(Ok(result)) => Ok(result),
            Ok(Err(_)) => Err(RequestError::internal_server_error(
                "Канал відповіді rust-analyzer закрито",
            )),
            Err(_) => Err(RequestError::internal_server_error(
                "Таймаут відповіді rust-analyzer",
            )),
        }
    }

    /// Надсилає JSON-RPC нотифікацію (без очікування відповіді).
    pub async fn notify(&self, method: &str, params: Value) -> RequestResult<()> {
        let msg = json!({
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
        });
        self.send(msg).await
    }

    /// Оновлює час останнього використання.
    pub async fn touch(&self) {
        *self.last_used.lock().await = Instant::now();
    }
}

// ─────────────────────────── Session Manager ─────────────────────────────────

/// Менеджер LSP-сесій для всіх активних документів.
pub struct LspManager {
    sessions: Arc<DashMap<Uuid, Arc<LspSession>>>,
}

impl Default for LspManager {
    fn default() -> Self {
        Self {
            sessions: Arc::new(DashMap::new()),
        }
    }
}

impl Clone for LspManager {
    fn clone(&self) -> Self {
        Self {
            sessions: Arc::clone(&self.sessions),
        }
    }
}

impl LspManager {
    /// Повертає існуючу або створює нову LSP-сесію для документа.
    pub async fn get_or_create(
        &self,
        doc_id: Uuid,
        files: &HashMap<String, String>,
    ) -> RequestResult<Arc<LspSession>> {
        // Якщо сесія вже існує — повертаємо її
        if let Some(session) = self.sessions.get(&doc_id) {
            let session = Arc::clone(&*session);
            session.touch().await;
            self.sync_files(&session, files).await?;
            return Ok(session);
        }

        // Інакше — створюємо нову
        tracing::info!("Створення нової LSP-сесії для документа {doc_id}");
        let session = Arc::new(create_session(files).await?);
        self.sessions.insert(doc_id, Arc::clone(&session));
        Ok(session)
    }

    /// Синхронізує тільки змінені файли (інкрементально).
    async fn sync_files(
        &self,
        session: &Arc<LspSession>,
        files: &HashMap<String, String>,
    ) -> RequestResult<()> {
        let mut hashes = session.files_hash.lock().await;
        let mut opened = session.opened_files.lock().await;
        let mut versions = session.file_versions.lock().await;

        for (rel_path, content) in files {
            if rel_path.ends_with(".gitkeep") {
                continue;
            }

            // Порівнюємо хеш вмісту, щоб уникнути зайвих запитів
            use std::hash::{DefaultHasher, Hash, Hasher};
            let mut h = DefaultHasher::new();
            content.hash(&mut h);
            let new_hash = h.finish();

            if hashes.get(rel_path) == Some(&new_hash) {
                continue; // Не змінився — пропускаємо
            }

            hashes.insert(rel_path.clone(), new_hash);
            let abs_path = session.dir_path.join(rel_path);

            // Створюємо батьківські директорії
            if let Some(parent) = abs_path.parent() {
                if let Err(e) = tokio::fs::create_dir_all(parent).await {
                    tracing::warn!("Не вдалося створити директорію {:?}: {e}", parent);
                }
            }

            // Записуємо файл
            if let Err(e) = tokio::fs::write(&abs_path, content).await {
                tracing::warn!("Не вдалося записати файл {:?}: {e}", abs_path);
                continue;
            }

            let uri = path_to_uri(&abs_path);

            if opened.contains(rel_path) {
                // Вже відкритий: надсилаємо didChange з інкрементованою версією
                let version = versions.entry(rel_path.clone()).or_insert(1);
                *version += 1;

                let _ = session.notify("textDocument/didChange", json!({
                    "textDocument": {
                        "uri": uri,
                        "version": *version,
                    },
                    "contentChanges": [{
                        "text": content,
                    }]
                })).await;
            } else {
                // Новий файл: надсилаємо didOpen
                opened.insert(rel_path.clone());
                versions.insert(rel_path.clone(), 1);

                let _ = session.notify("textDocument/didOpen", json!({
                    "textDocument": {
                        "uri": uri,
                        "languageId": "rust",
                        "version": 1,
                        "text": content,
                    }
                })).await;
            }
        }

        // Закриваємо видалені файли
        let mut to_close = Vec::new();
        for opened_file in opened.iter() {
            if !files.contains_key(opened_file) {
                to_close.push(opened_file.clone());
            }
        }
        for rel_path in to_close {
            opened.remove(&rel_path);
            versions.remove(&rel_path);
            let abs_path = session.dir_path.join(&rel_path);
            let uri = path_to_uri(&abs_path);

            let _ = session.notify("textDocument/didClose", json!({
                "textDocument": {
                    "uri": uri,
                }
            })).await;

            // Видаляємо з диску
            tokio::fs::remove_file(abs_path).await.ok();
        }

        Ok(())
    }

    /// Видаляє сесії, що не використовувались більше 10 хвилин.
    pub fn start_cleanup_task(&self) {
        let sessions = Arc::clone(&self.sessions);
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(120)).await;
                let ttl = std::time::Duration::from_secs(600); // 10 хвилин
                let to_remove: Vec<Uuid> = sessions
                    .iter()
                    .filter_map(|entry| {
                        let session = entry.value();
                        let last = session.last_used.try_lock().ok()?;
                        if last.elapsed() > ttl { Some(*entry.key()) } else { None }
                    })
                    .collect();

                for id in to_remove {
                    sessions.remove(&id);
                    tracing::info!("Видалено застарілу LSP-сесію для документа {id}");
                }
            }
        });
    }
}

// ─────────────────────────── Session factory ─────────────────────────────────

/// Знаходить справжній бінарний файл rust-analyzer і шлях до його бібліотек.
/// В Docker-оточенні /usr/local/bin/rust-analyzer вже встановлений Dockerfile,
/// а LD_LIBRARY_PATH=/usr/local/rustup-libs задано через Docker ENV.
async fn find_rust_analyzer() -> RequestResult<(String, Option<String>)> {
    // 1. Пробуємо /usr/local/bin/rust-analyzer (встановлено Dockerfile)
    let canonical = "/usr/local/bin/rust-analyzer";
    if std::path::Path::new(canonical).exists() {
        // Перевіряємо чи задано LD_LIBRARY_PATH через Docker ENV
        let lib_path = std::env::var("LD_LIBRARY_PATH").ok().filter(|s| !s.is_empty());
        tracing::info!("rust-analyzer: {canonical}, LD_LIBRARY_PATH: {:?}", lib_path);
        return Ok((canonical.to_string(), lib_path));
    }

    // 2. Пробуємо знайти через rustup (для локальної розробки без Docker)
    let rustup_output = tokio::process::Command::new("rustup")
        .args(["which", "rust-analyzer"])
        .output()
        .await;

    if let Ok(output) = rustup_output {
        if output.status.success() {
            let ra_bin = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !ra_bin.is_empty() && std::path::Path::new(&ra_bin).exists() {
                // Шлях до бібліотек: замінюємо /bin/rust-analyzer на /lib
                let lib_path = std::path::Path::new(&ra_bin)
                    .parent()  // .../bin
                    .and_then(|p| p.parent())  // toolchain root
                    .map(|root| root.join("lib"))
                    .filter(|p| p.exists())
                    .map(|p| p.to_string_lossy().to_string());

                tracing::info!("rust-analyzer (rustup): {ra_bin}, lib: {:?}", lib_path);
                return Ok((ra_bin, lib_path));
            }
        }
    }

    // 3. Сканування директорій rustup toolchains
    let toolchain_dir = "/usr/local/rustup/toolchains";
    if let Ok(entries) = std::fs::read_dir(toolchain_dir) {
        for entry in entries.flatten() {
            let ra = entry.path().join("bin/rust-analyzer");
            let lib = entry.path().join("lib");
            if ra.exists() {
                let ra_str = ra.to_string_lossy().to_string();
                let lib_str = if lib.exists() { Some(lib.to_string_lossy().to_string()) } else { None };
                tracing::info!("rust-analyzer (toolchain scan): {ra_str}, lib: {:?}", lib_str);
                return Ok((ra_str, lib_str));
            }
        }
    }

    // 4. Останній fallback: системний PATH
    tracing::warn!("rust-analyzer не знайдено, пробуємо системний PATH");
    Ok(("rust-analyzer".to_string(), None))
}

/// Створює нову LSP-сесію: записує файли проекту, запускає rust-analyzer,
/// виконує LSP-рукостискання та відкриває початкові файли.
async fn create_session(files: &HashMap<String, String>) -> RequestResult<LspSession> {
    // 1. Підготовка тимчасової директорії
    let temp_dir = TempDir::new().map_err(|e| {
        tracing::error!("Не вдалося створити temp dir для LSP: {e}");
        RequestError::internal_server_error("Не вдалося підготувати LSP-середовище")
    })?;

    let dir_path = temp_dir.path().to_path_buf();

    // 2. Записуємо файли проекту
    write_project_files(&dir_path, files).await?;

    // 3. Знаходимо шлях до rust-analyzer (в Docker потрібно використовувати
    //    повний шлях через rustup, бо /usr/local/cargo/bin/rust-analyzer є лише
    //    символічним посиланням на rustup-stub)
    let (ra_path, lib_path) = find_rust_analyzer().await?;
    tracing::info!("Запуск rust-analyzer: {:?} (lib: {:?})", ra_path, lib_path);

    let mut cmd = Command::new(&ra_path);
    cmd.current_dir(&dir_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true);

    // Встановлюємо LD_LIBRARY_PATH якщо потрібно (для Docker-оточення)
    if let Some(lib) = &lib_path {
        // Додаємо до існуючого LD_LIBRARY_PATH якщо він є
        let existing = std::env::var("LD_LIBRARY_PATH").unwrap_or_default();
        let new_path = if existing.is_empty() {
            lib.clone()
        } else {
            format!("{lib}:{existing}")
        };
        cmd.env("LD_LIBRARY_PATH", new_path);
    }

    let mut child = cmd.spawn().map_err(|e| {
            tracing::error!("Не вдалося запустити rust-analyzer ({:?}): {e}", ra_path);
            RequestError::internal_server_error("Не вдалося запустити rust-analyzer")
        })?;

    let stdin = child.stdin.take().unwrap();
    let stdout = child.stdout.take().unwrap();

    let pending: Arc<DashMap<u32, oneshot::Sender<Value>>> = Arc::new(DashMap::new());
    let pending_clone = Arc::clone(&pending);

    // 4. Запускаємо фонову задачу читання stdout
    tokio::spawn(read_stdout_task(stdout, pending_clone));

    let session = LspSession {
        stdin: Mutex::new(stdin),
        pending,
        next_id: AtomicU32::new(1),
        _temp_dir: temp_dir,
        dir_path: dir_path.clone(),
        files_hash: Mutex::new(HashMap::new()),
        last_used: Mutex::new(Instant::now()),
        _child: Mutex::new(child),
        opened_files: Mutex::new(std::collections::HashSet::new()),
        file_versions: Mutex::new(HashMap::new()),
    };

    // 5. LSP initialize handshake
    let init_result = session.request("initialize", json!({
        "processId": std::process::id(),
        "rootUri": path_to_uri(&dir_path),
        "capabilities": {
            "textDocument": {
                "completion": {
                    "completionItem": {
                        "snippetSupport": true,
                        "documentationFormat": ["markdown", "plaintext"],
                        "insertReplaceSupport": true,
                    },
                    "completionItemKind": {
                        "valueSet": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]
                    }
                },
                "hover": {},
                "signatureHelp": {}
            },
            "workspace": {
                "workspaceFolders": true
            }
        },
        "initializationOptions": {
            "diagnostics": {
                "enable": false
            },
            "check": {
                "enable": false
            },
            "checkOnSave": {
                "enable": false
            }
        },
        "workspaceFolders": [{
            "uri": path_to_uri(&dir_path),
            "name": "co-write"
        }]
    })).await?;

    tracing::debug!("LSP initialize response: {:?}", init_result.get("result"));

    // 6. Надсилаємо "initialized" нотифікацію
    session.notify("initialized", json!({})).await?;

    // 7. Відкриваємо всі файли проекту
    {
        let mut opened = session.opened_files.lock().await;
        let mut versions = session.file_versions.lock().await;

        for (rel_path, content) in files {
            if rel_path.ends_with(".gitkeep") {
                continue;
            }
            let abs_path = dir_path.join(rel_path);
            let uri = path_to_uri(&abs_path);

            opened.insert(rel_path.clone());
            versions.insert(rel_path.clone(), 1);

            let _ = session.notify("textDocument/didOpen", json!({
                "textDocument": {
                    "uri": uri,
                    "languageId": "rust",
                    "version": 1,
                    "text": content,
                }
            })).await;
        }
    }

    // 8. Чекаємо поки rust-analyzer завантажить проект (початкова затримка)
    // rust-analyzer індексує асинхронно, тому потрібно дати час перед першим запитом
    tokio::time::sleep(std::time::Duration::from_millis(2000)).await;

    tracing::info!("LSP-сесія ініціалізована для директорії {:?}", dir_path);
    Ok(session)
}

/// Записує файли проекту в тимчасову директорію.
async fn write_project_files(
    dir: &std::path::Path,
    files: &HashMap<String, String>,
) -> RequestResult<()> {
    let has_cargo = files.contains_key("Cargo.toml");

    // Якщо немає Cargo.toml — генеруємо базовий
    if !has_cargo {
        let cargo_toml = r#"[package]
name = "co-write-project"
version = "0.1.0"
edition = "2021"
"#;
        tokio::fs::write(dir.join("Cargo.toml"), cargo_toml).await.ok();
    }

    for (rel_path, content) in files {
        if rel_path.ends_with(".gitkeep") {
            continue;
        }

        let abs_path = dir.join(rel_path);
        if let Some(parent) = abs_path.parent() {
            tokio::fs::create_dir_all(parent).await.ok();
        }
        tokio::fs::write(&abs_path, content).await.map_err(|e| {
            tracing::error!("Не вдалося записати файл {:?}: {e}", abs_path);
            RequestError::internal_server_error("Не вдалося підготувати файли проекту")
        })?;
    }

    if has_cargo {
        if let Some(content) = files.get("Cargo.toml") {
            tokio::fs::write(dir.join("Cargo.toml"), content).await.ok();
        }
    }

    Ok(())
}

/// Фонова задача: читає stdout rust-analyzer, парсить JSON-RPC та маршрутизує відповіді.
async fn read_stdout_task(
    stdout: tokio::process::ChildStdout,
    pending: Arc<DashMap<u32, oneshot::Sender<Value>>>,
) {
    let mut reader = BufReader::new(stdout);

    loop {
        // Читаємо заголовки Content-Length
        let mut content_length: usize = 0;
        loop {
            let mut line = String::new();
            match reader.read_line(&mut line).await {
                Ok(0) => {
                    tracing::info!("rust-analyzer stdout закрито");
                    return;
                }
                Ok(_) => {}
                Err(e) => {
                    tracing::error!("Помилка читання заголовку LSP: {e}");
                    return;
                }
            }

            let trimmed = line.trim();
            if trimmed.is_empty() {
                break; // Порожній рядок — кінець заголовків
            }
            if let Some(rest) = trimmed.strip_prefix("Content-Length: ") {
                content_length = rest.parse().unwrap_or(0);
            }
        }

        if content_length == 0 {
            continue;
        }

        // Читаємо тіло повідомлення
        let mut body = vec![0u8; content_length];
        if let Err(e) = reader.read_exact(&mut body).await {
            tracing::error!("Помилка читання тіла LSP: {e}");
            return;
        }

        let msg: Value = match serde_json::from_slice(&body) {
            Ok(v) => v,
            Err(e) => {
                tracing::warn!("Не вдалося розпарсити LSP повідомлення: {e}");
                continue;
            }
        };

        // Якщо це відповідь на запит — відправляємо в канал
        if let Some(id) = msg.get("id").and_then(|v| v.as_u64()) {
            if let Some((_, tx)) = pending.remove(&(id as u32)) {
                let _ = tx.send(msg);
            }
        }
        // Нотифікації ($/progress, window/logMessage тощо) — просто ігноруємо
    }
}

// ─────────────────────────── Utilities ───────────────────────────────────────

/// Перетворює шлях файлу на URI формат (file:///...).
fn path_to_uri(path: &std::path::Path) -> String {
    let canonical = path.to_str().unwrap_or("");
    format!("file://{canonical}")
}

/// Запит completions через rust-analyzer для заданої позиції у файлі.
/// Автоматично повторює запит якщо результат порожній (rust-analyzer ще індексує).
pub async fn get_completions(
    session: &LspSession,
    file_path: &str,
    content: &str,
    line: u32,
    character: u32,
) -> RequestResult<Vec<LspCompletionItem>> {
    let abs_path = session.dir_path.join(file_path);
    let uri = path_to_uri(&abs_path);

    // Оновлюємо вміст файлу в rust-analyzer
    {
        let mut versions = session.file_versions.lock().await;
        let version = versions.entry(file_path.to_string()).or_insert(1);
        *version += 1;

        session.notify("textDocument/didChange", json!({
            "textDocument": { "uri": &uri, "version": *version },
            "contentChanges": [{ "text": content }]
        })).await?;
    }

    // Запит completions з retry (rust-analyzer може ще індексувати)
    let retry_delays = [0u64, 1500, 3000, 5000]; // мс між спробами

    for (attempt, &delay) in retry_delays.iter().enumerate() {
        if delay > 0 {
            tracing::debug!("Очікування {} мс перед retry #{} completions", delay, attempt);
            tokio::time::sleep(std::time::Duration::from_millis(delay)).await;
        }

        let result = session.request("textDocument/completion", json!({
            "textDocument": { "uri": &uri },
            "position": { "line": line, "character": character },
            "context": { "triggerKind": 1 }  // 1 = Invoked
        })).await?;

        // Парсимо результат
        let items_value = result
            .get("result")
            .and_then(|r| {
                // Може бути CompletionList або Vec<CompletionItem>
                if let Some(list) = r.get("items") {
                    Some(list)
                } else if r.is_array() {
                    Some(r)
                } else {
                    None
                }
            });

        let items: Vec<LspCompletionItem> = match items_value {
            Some(arr) if arr.is_array() => arr
                .as_array()
                .unwrap()
                .iter()
                .filter_map(parse_completion_item)
                .collect(),
            _ => vec![],
        };

        tracing::debug!("Спроба #{}: {} completion items для {}:{}:{}",
            attempt + 1, items.len(), file_path, line, character);

        // Якщо отримали результати — повертаємо
        if !items.is_empty() {
            return Ok(items);
        }

        // Якщо це остання спроба — повертаємо порожній список
        if attempt + 1 == retry_delays.len() {
            tracing::warn!("Після {} спроб completions порожні для {}:{}:{}",
                retry_delays.len(), file_path, line, character);
        }
    }

    Ok(vec![])
}

/// Запит hover інформації через rust-analyzer для заданої позиції у файлі.
pub async fn get_hover(
    session: &LspSession,
    file_path: &str,
    content: &str,
    line: u32,
    character: u32,
) -> RequestResult<Option<String>> {
    let abs_path = session.dir_path.join(file_path);
    let uri = path_to_uri(&abs_path);

    // Оновлюємо вміст файлу в rust-analyzer
    {
        let mut versions = session.file_versions.lock().await;
        let version = versions.entry(file_path.to_string()).or_insert(1);
        *version += 1;

        session.notify("textDocument/didChange", json!({
            "textDocument": { "uri": &uri, "version": *version },
            "contentChanges": [{ "text": content }]
        })).await?;
    }

    let result = session.request("textDocument/hover", json!({
        "textDocument": { "uri": &uri },
        "position": { "line": line, "character": character }
    })).await?;

    // Парсимо результат
    let hover_value = result.get("result");
    if hover_value.is_none() || hover_value.unwrap().is_null() {
        return Ok(None);
    }

    let contents = hover_value.unwrap().get("contents");
    if let Some(contents) = contents {
        if contents.is_string() {
            return Ok(Some(contents.as_str().unwrap().to_string()));
        } else if contents.is_array() {
            let mut parts = vec![];
            for part in contents.as_array().unwrap() {
                if part.is_string() {
                    parts.push(part.as_str().unwrap().to_string());
                } else if let Some(value) = part.get("value") {
                    if value.is_string() {
                        parts.push(value.as_str().unwrap().to_string());
                    }
                }
            }
            if !parts.is_empty() {
                return Ok(Some(parts.join("\n\n")));
            }
        } else if let Some(value) = contents.get("value") {
            if value.is_string() {
                return Ok(Some(value.as_str().unwrap().to_string()));
            }
        }
        return Ok(None);
    }

    Ok(None)
}

/// Перетворює LSP CompletionItem (serde_json Value) у наш LspCompletionItem.
fn parse_completion_item(v: &Value) -> Option<LspCompletionItem> {
    let label = v.get("label")?.as_str()?.to_string();
    let kind  = v.get("kind").and_then(|k| k.as_u64()).unwrap_or(1) as u8;

    let detail = v.get("detail").and_then(|d| d.as_str()).map(|s| s.to_string());

    let documentation = v
        .get("documentation")
        .and_then(|d| {
            if d.is_string() {
                d.as_str().map(|s| s.to_string())
            } else {
                d.get("value").and_then(|s| s.as_str()).map(|s| s.to_string())
            }
        });

    let insert_text = v
        .get("insertText")
        .and_then(|t| t.as_str())
        .map(|s| s.to_string());

    let insert_text_format = v
        .get("insertTextFormat")
        .and_then(|f| f.as_u64())
        .map(|f| f as u8);

    Some(LspCompletionItem {
        label,
        detail,
        documentation,
        kind,
        insert_text,
        insert_text_format,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_lsp_completion() {
        let mut files = HashMap::new();
        files.insert("src/main.rs".to_string(), "mod some;\nfn main() {\n    some::\n}".to_string());
        files.insert("src/some.rs".to_string(), "pub fn my_test_func() {}\n".to_string());

        let session = create_session(&files).await.unwrap();
        // Wait a bit for rust-analyzer to index the project
        tokio::time::sleep(std::time::Duration::from_secs(3)).await;

        let completions = get_completions(
            &session,
            "src/main.rs",
            "mod some;\nfn main() {\n    some::\n}",
            2, // Line 2 (0-indexed)
            10, // Column 10 (after "some::")
        ).await.unwrap();

        println!("COMPLETIONS COUNT: {}", completions.len());
        for item in &completions {
            println!("COMPLETION: {:?}", item);
        }
        assert!(!completions.is_empty(), "Completions list should not be empty!");
    }
}

