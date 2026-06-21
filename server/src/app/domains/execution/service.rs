use std::process::Stdio;
use std::time::Duration;
use tokio::fs;
use tokio::process::Command;
use tokio::time::timeout;
use tempfile::TempDir;

use crate::app::{RequestError, RequestResult};

/// Результат виконання коду в ізольованому середовищі.
pub struct ExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

/// Перевіряє, що відносний шлях файлу не виходить за межі робочої директорії
/// (захист від Directory Traversal через `..` або абсолютних шляхів).
pub(crate) fn is_path_safe(path: &str) -> bool {
    !path.contains("..") && !path.starts_with('/')
}

/// Визначає, чи слід пропустити запис при розпаковці файлів проекту
/// (маркери директорій та .gitkeep-файли не несуть вмісту).
pub(crate) fn should_skip_entry(path: &str) -> bool {
    path.ends_with('/') || path.ends_with(".gitkeep")
}

/// Знаходить точку входу для збірки чистим `rustc` (без Cargo).
pub(crate) fn find_entrypoint(files: &std::collections::HashMap<String, String>) -> Option<&'static str> {
    if files.contains_key("src/main.rs") {
        Some("src/main.rs")
    } else if files.contains_key("main.rs") {
        Some("main.rs")
    } else {
        None
    }
}

/// Парсить назву пакету з вмісту Cargo.toml; повертає "app", якщо поле `name` відсутнє.
pub(crate) fn parse_package_name(cargo_toml_content: &str) -> String {
    for line in cargo_toml_content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("name") {
            if let Some(val) = trimmed.split('=').nth(1) {
                return val.replace('"', "").trim().to_string();
            }
        }
    }
    "app".to_string()
}

#[cfg(unix)]
unsafe extern "C" {
    fn getuid() -> u32;
}

#[cfg(unix)]
fn get_sandbox_command(exe_path: &std::path::Path, temp_dir_path: &std::path::Path) -> Command {
    // Перевіряємо, чи запущено процес від імені root і чи доступний prlimit
    let has_prlimit = std::path::Path::new("/usr/bin/prlimit").exists() 
        || std::path::Path::new("/bin/prlimit").exists();
    let is_root = unsafe { getuid() == 0 };

    let mut cmd = if has_prlimit {
        let mut c = Command::new("prlimit");
        c.arg("--as=64000000")   // Обмежуємо віртуальну пам'ять до 64 МБ
         .arg("--nproc=10")      // Обмежуємо максимальну кількість процесів до 10
         .arg("--cpu=2")         // Обмежуємо процесорний час до 2 секунд
         .arg(exe_path);
        c
    } else {
        Command::new(exe_path)
    };

    if is_root {
        // У виробничому середовищі (всередині Docker) виконуємо від імені непривілейованого користувача 'sandbox' (UID 2000, GID 2000)
        cmd.uid(2000);
        cmd.gid(2000);
    }

    cmd.current_dir(temp_dir_path);
    cmd
}

#[cfg(unix)]
fn set_sandbox_permissions(temp_dir_path: &std::path::Path, exe_path: &std::path::Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;

    // Дозволяємо доступ до тимчасової директорії для користувача sandbox
    std::fs::set_permissions(temp_dir_path, std::fs::Permissions::from_mode(0o755))?;

    // Дозволяємо читання та виконання бінарного файлу для користувача sandbox
    std::fs::set_permissions(exe_path, std::fs::Permissions::from_mode(0o755))?;

    Ok(())
}

/// Компілює та виконує багатофайловий проект Rust у ізольованому середовищі (пісочниці) з обмеженнями ресурсів.
pub async fn execute_rust_code(
    files: &std::collections::HashMap<String, String>,
    _ctx: &crate::app::ServiceContext<'_>,
) -> RequestResult<ExecutionResult> {
    // Створюємо тимчасову директорію для збирання та виконання
    let temp_dir = TempDir::new().map_err(|e| {
        tracing::error!("Не вдалося створити тимчасову директорію: {}", e);
        RequestError::internal_server_error("Не вдалося створити тимчасове середовище")
    })?;

    // Записуємо структуру папок та файлів проекту
    for (relative_path, content) in files {
        // Пропускаємо записи директорій (path/to/dir/) та gitkeep-маркери
        if should_skip_entry(relative_path) {
            continue;
        }
        // Запобігаємо вразливості обходу директорії (Directory Traversal)
        if !is_path_safe(relative_path) {
            return Err(RequestError::bad_request(format!("Неприпустимий шлях до файлу: {}", relative_path)));
        }

        let file_path = temp_dir.path().join(relative_path);

        // Створюємо батьківські папки для файлу, якщо необхідно
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                tracing::error!("Не вдалося створити директорію {:?}: {}", parent, e);
                RequestError::internal_server_error("Не вдалося підготувати структуру папок проекту")
            })?;
        }

        // Записуємо вміст файлу
        fs::write(&file_path, content).await.map_err(|e| {
            tracing::error!("Не вдалося записати файл {:?}: {}", file_path, e);
            RequestError::internal_server_error("Не вдалося зберегти файли проекту")
        })?;
    }

    let exe_name = if cfg!(windows) { "program.exe" } else { "program" };
    let exe_path = temp_dir.path().join(exe_name);

    // Визначаємо тип збирання: Cargo чи чистий rustc
    let is_cargo = files.contains_key("Cargo.toml");
    let compile_timeout = Duration::from_secs(15);

    let mut compile_cmd = if is_cargo {
        let mut cmd = Command::new("cargo");
        cmd.arg("build")
           .arg("--release")
           .current_dir(temp_dir.path())
           .stdout(Stdio::piped())
           .stderr(Stdio::piped());
        cmd
    } else {
        let entrypoint = find_entrypoint(files)
            .ok_or_else(|| RequestError::bad_request("Проект повинен містити точку входу: main.rs або src/main.rs"))?;

        let mut cmd = Command::new("rustc");
        cmd.arg(entrypoint)
           .arg("-o")
           .arg(&exe_path)
           .current_dir(temp_dir.path())
           .stdout(Stdio::piped())
           .stderr(Stdio::piped());
        cmd
    };

    let compile_future = compile_cmd.output();
    let compile_output = match timeout(compile_timeout, compile_future).await {
        Ok(Ok(output)) => output,
        Ok(Err(e)) => {
            tracing::error!("Не вдалося запустити компілятор: {}", e);
            return Err(RequestError::internal_server_error("Не вдалося скомпілювати проект"));
        }
        Err(_) => {
            return Ok(ExecutionResult {
                success: false,
                stdout: "".to_string(),
                stderr: "Перевищено ліміт часу компіляції (ліміт 15 секунд).".to_string(),
            });
        }
    };

    if !compile_output.status.success() {
        return Ok(ExecutionResult {
            success: false,
            stdout: String::from_utf8_lossy(&compile_output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&compile_output.stderr).to_string(),
        });
    }

    // Для збірок Cargo, копіюємо отриманий бінарний файл до exe_path
    if is_cargo {
        let package_name = files
            .get("Cargo.toml")
            .map(|content| parse_package_name(content))
            .unwrap_or_else(|| "app".to_string());

        let target_bin = temp_dir.path().join("target").join("release").join(&package_name);
        if target_bin.exists() {
            fs::copy(&target_bin, &exe_path).await.map_err(|e| {
                tracing::error!("Не вдалося скопіювати збірку Cargo: {}", e);
                RequestError::internal_server_error("Помилка підготовки скомпілованого файлу")
            })?;
        } else {
            return Err(RequestError::internal_server_error("Не вдалося знайти скомпілований бінарний файл у цільовій директорії Cargo"));
        }
    }

    // Налаштовуємо дозволи для ізольованого середовища пісочниці (тільки для Unix)
    #[cfg(unix)]
    {
        if let Err(e) = set_sandbox_permissions(temp_dir.path(), &exe_path) {
            tracing::error!("Не вдалося налаштувати дозволи для пісочниці: {}", e);
            return Err(RequestError::internal_server_error("Не вдалося підготувати дозволи для пісочниці"));
        }
    }

    // Будуємо команду виконання з обмеженнями ресурсів та ізоляцією привілеїв
    let mut child_cmd = {
        #[cfg(unix)]
        {
            get_sandbox_command(&exe_path, temp_dir.path())
        }
        #[cfg(not(unix))]
        {
            let mut cmd = Command::new(&exe_path);
            cmd.current_dir(temp_dir.path());
            cmd
        }
    };

    let child = child_cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| {
            tracing::error!("Не вдалося запустити програму: {}", e);
            RequestError::internal_server_error("Не вдалося виконати код в ізольованому середовищі (пісочниці)")
        })?;

    // Виконуємо з жорстким таймаутом у 5 секунд
    let run_timeout = Duration::from_secs(5);
    
    match timeout(run_timeout, child.wait_with_output()).await {
        Ok(Ok(run_output)) => {
            Ok(ExecutionResult {
                success: run_output.status.success(),
                stdout: String::from_utf8_lossy(&run_output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&run_output.stderr).to_string(),
            })
        }
        Ok(Err(e)) => {
            tracing::error!("Не вдалося дочекатися завершення програми: {}", e);
            Err(RequestError::internal_server_error("Помилка під час виконання програми"))
        }
        Err(_) => {
            Ok(ExecutionResult {
                success: false,
                stdout: "".to_string(),
                stderr: "Перевищено ліміт часу виконання (ліміт 5 секунд).".to_string(),
            })
        }
    }
}

/// Компілює та виконує тести Rust у проекті (з підтримкою як Cargo, так і rustc --test).
pub async fn execute_rust_tests(
    files: &std::collections::HashMap<String, String>,
    _ctx: &crate::app::ServiceContext<'_>,
) -> RequestResult<ExecutionResult> {
    // Створюємо тимчасову директорію для збирання та виконання
    let temp_dir = TempDir::new().map_err(|e| {
        tracing::error!("Не вдалося створити тимчасову директорію для тестів: {}", e);
        RequestError::internal_server_error("Не вдалося створити тимчасове середовище")
    })?;

    // Записуємо структуру папок та файлів проекту
    for (relative_path, content) in files {
        // Пропускаємо записи директорій та gitkeep-маркери
        if should_skip_entry(relative_path) {
            continue;
        }
        if !is_path_safe(relative_path) {
            return Err(RequestError::bad_request(format!("Неприпустимий шлях до файлу: {}", relative_path)));
        }

        let file_path = temp_dir.path().join(relative_path);

        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                tracing::error!("Не вдалося створити директорію {:?}: {}", parent, e);
                RequestError::internal_server_error("Не вдалося підготувати структуру папок проекту")
            })?;
        }

        fs::write(&file_path, content).await.map_err(|e| {
            tracing::error!("Не вдалося записати файл {:?}: {}", file_path, e);
            RequestError::internal_server_error("Не вдалося зберегти файли проекту")
        })?;
    }

    let exe_name = if cfg!(windows) { "test_program.exe" } else { "test_program" };
    let exe_path = temp_dir.path().join(exe_name);

    let is_cargo = files.contains_key("Cargo.toml");
    let run_timeout = Duration::from_secs(10);

    if is_cargo {
        let mut cmd = Command::new("cargo");
        cmd.arg("test")
           .current_dir(temp_dir.path())
           .stdout(Stdio::piped())
           .stderr(Stdio::piped());

        let fut = cmd.output();
        match timeout(run_timeout, fut).await {
            Ok(Ok(output)) => {
                Ok(ExecutionResult {
                    success: output.status.success(),
                    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                })
            }
            Ok(Err(e)) => {
                tracing::error!("Не вдалося запустити cargo test: {}", e);
                Err(RequestError::internal_server_error("Не вдалося запустити тести"))
            }
            Err(_) => {
                Ok(ExecutionResult {
                    success: false,
                    stdout: "".to_string(),
                    stderr: "Перевищено ліміт часу виконання тестів (ліміт 10 секунд).".to_string(),
                })
            }
        }
    } else {
        let entrypoint = find_entrypoint(files)
            .ok_or_else(|| RequestError::bad_request("Проект повинен містити точку входу: main.rs або src/main.rs"))?;

        let mut compile_cmd = Command::new("rustc");
        compile_cmd.arg("--test")
                   .arg(entrypoint)
                   .arg("-o")
                   .arg(&exe_path)
                   .current_dir(temp_dir.path())
                   .stdout(Stdio::piped())
                   .stderr(Stdio::piped());

        let compile_future = compile_cmd.output();
        let compile_output = match timeout(Duration::from_secs(10), compile_future).await {
            Ok(Ok(output)) => output,
            Ok(Err(e)) => {
                tracing::error!("Не вдалося запустити rustc --test: {}", e);
                return Err(RequestError::internal_server_error("Не вдалося скомпілювати тести"));
            }
            Err(_) => {
                return Ok(ExecutionResult {
                    success: false,
                    stdout: "".to_string(),
                    stderr: "Перевищено ліміт часу компіляції тестів (ліміт 10 секунд).".to_string(),
                });
            }
        };

        if !compile_output.status.success() {
            return Ok(ExecutionResult {
                success: false,
                stdout: String::from_utf8_lossy(&compile_output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&compile_output.stderr).to_string(),
            });
        }

        #[cfg(unix)]
        {
            if let Err(e) = set_sandbox_permissions(temp_dir.path(), &exe_path) {
                tracing::error!("Не вдалося налаштувати дозволи для пісочниці тестів: {}", e);
                return Err(RequestError::internal_server_error("Не вдалося підготувати дозволи для пісочниці"));
            }
        }

        let mut child_cmd = {
            #[cfg(unix)]
            {
                get_sandbox_command(&exe_path, temp_dir.path())
            }
            #[cfg(not(unix))]
            {
                let mut cmd = Command::new(&exe_path);
                cmd.current_dir(temp_dir.path());
                cmd
            }
        };

        let child = child_cmd
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| {
                tracing::error!("Не вдалося запустити тестову програму: {}", e);
                RequestError::internal_server_error("Не вдалося виконати тести в ізольованому середовищі")
            })?;

        match timeout(run_timeout, child.wait_with_output()).await {
            Ok(Ok(run_output)) => {
                Ok(ExecutionResult {
                    success: run_output.status.success(),
                    stdout: String::from_utf8_lossy(&run_output.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&run_output.stderr).to_string(),
                })
            }
            Ok(Err(e)) => {
                tracing::error!("Не вдалося дочекатися завершення тестів: {}", e);
                Err(RequestError::internal_server_error("Помилка під час виконання тестів"))
            }
            Err(_) => {
                Ok(ExecutionResult {
                    success: false,
                    stdout: "".to_string(),
                    stderr: "Перевищено ліміт часу виконання тестів (ліміт 10 секунд).".to_string(),
                })
            }
        }
    }
}

/// Форматує переданий Rust код за допомогою `rustfmt`.
pub async fn format_rust_code(code: &str) -> RequestResult<String> {
    use tokio::io::AsyncWriteExt;

    let mut child = Command::new("rustfmt")
        .arg("--edition")
        .arg("2021")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            tracing::error!("Не вдалося запустити rustfmt: {}", e);
            RequestError::internal_server_error("Не вдалося запустити форматувальник коду")
        })?;

    let mut stdin = child.stdin.take().ok_or_else(|| {
        RequestError::internal_server_error("Не вдалося захопити stdin форматувальника")
    })?;

    let code_clone = code.to_string();
    tokio::spawn(async move {
        if let Err(e) = stdin.write_all(code_clone.as_bytes()).await {
            tracing::error!("Не вдалося записати код у stdin rustfmt: {}", e);
        }
    });

    let output = child.wait_with_output().await.map_err(|e| {
        tracing::error!("Помилка при очікуванні rustfmt: {}", e);
        RequestError::internal_server_error("Помилка форматування коду")
    })?;

    if output.status.success() {
        let formatted = String::from_utf8(output.stdout).map_err(|e| {
            tracing::error!("rustfmt повернув некоректний UTF-8: {}", e);
            RequestError::internal_server_error("Форматувальник повернув некоректний результат")
        })?;
        Ok(formatted)
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        tracing::warn!("Помилка rustfmt: {}", err_msg);
        // Якщо помилка синтаксису, просто повертаємо оригінальний код
        Ok(code.to_string())
    }
}
