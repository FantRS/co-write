/// Модульні тести для сервісу виконання коду (execution).
/// Усі тести викликають реальні `pub(crate)` функції з `execution::service`,
/// а не їх копії, щоб ловити регресії в production-коді.
#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use crate::app::domains::execution::service::{
        find_entrypoint, is_path_safe, parse_package_name, should_skip_entry,
    };

    mod path_safety {
        use super::*;

        /// Тест 1: Нормальні відносні шляхи є безпечними.
        #[test]
        fn normal_paths_are_allowed() {
            assert!(is_path_safe("src/main.rs"), "Відносний шлях src/main.rs є безпечним");
            assert!(is_path_safe("main.rs"), "Шлях main.rs є безпечним");
            assert!(is_path_safe("src/lib.rs"), "Шлях src/lib.rs є безпечним");
            assert!(is_path_safe("Cargo.toml"), "Шлях Cargo.toml є безпечним");
        }

        /// Тест 2: Шляхи з `..` блокуються як атака обходу директорії.
        #[test]
        fn traversal_with_dotdot_is_blocked() {
            assert!(!is_path_safe("../etc/passwd"), "Шлях '../etc/passwd' є небезпечним");
            assert!(!is_path_safe("../../secret"), "Подвійний '../..' є небезпечним");
            assert!(!is_path_safe("src/../../../etc"), "Вбудований '..' є небезпечним");
        }

        /// Тест 3: Абсолютні шляхи блокуються.
        #[test]
        fn absolute_paths_are_blocked() {
            assert!(!is_path_safe("/etc/passwd"), "Абсолютний шлях /etc/passwd є небезпечним");
            assert!(!is_path_safe("/root/.ssh/id_rsa"), "Абсолютний шлях до SSH ключа є небезпечним");
            assert!(!is_path_safe("/proc/self/mem"), "Абсолютний шлях до /proc є небезпечним");
        }
    }

    mod file_filter {
        use super::*;

        /// Тест 4: Записи директорій (що закінчуються на '/') відфільтровуються.
        #[test]
        fn directory_markers_are_skipped() {
            assert!(should_skip_entry("src/"), "Запис 'src/' є директорією і повинен бути пропущений");
            assert!(should_skip_entry("assets/images/"), "Вкладена директорія повинна бути пропущена");
        }

        /// Тест 5: Файли-маркери .gitkeep відфільтровуються.
        #[test]
        fn gitkeep_markers_are_skipped() {
            assert!(should_skip_entry(".gitkeep"), ".gitkeep повинен бути пропущений");
            assert!(should_skip_entry("src/.gitkeep"), "Вкладений .gitkeep повинен бути пропущений");
        }

        /// Тест 6: Звичайні файли коду не відфільтровуються.
        #[test]
        fn normal_files_are_not_skipped() {
            assert!(!should_skip_entry("main.rs"), "main.rs не повинен бути пропущений");
            assert!(!should_skip_entry("Cargo.toml"), "Cargo.toml не повинен бути пропущений");
            assert!(!should_skip_entry("src/lib.rs"), "src/lib.rs не повинен бути пропущений");
        }
    }

    mod entrypoint {
        use super::*;

        /// Тест 7: Пріоритет надається src/main.rs над main.rs.
        #[test]
        fn prefers_src_main_rs() {
            let mut files = HashMap::new();
            files.insert("src/main.rs".to_string(), "fn main() {}".to_string());
            files.insert("main.rs".to_string(), "fn main() {}".to_string());

            assert_eq!(
                find_entrypoint(&files),
                Some("src/main.rs"),
                "src/main.rs повинен мати пріоритет над main.rs"
            );
        }

        /// Тест 8: Якщо є лише main.rs — обирається він.
        #[test]
        fn falls_back_to_main_rs() {
            let mut files = HashMap::new();
            files.insert("main.rs".to_string(), "fn main() {}".to_string());

            assert_eq!(
                find_entrypoint(&files),
                Some("main.rs"),
                "main.rs повинен бути обраний за відсутності src/main.rs"
            );
        }

        /// Тест 9: Якщо немає жодної точки входу — повертається None.
        #[test]
        fn returns_none_when_missing() {
            let mut files = HashMap::new();
            files.insert("lib.rs".to_string(), "pub fn hello() {}".to_string());

            assert_eq!(
                find_entrypoint(&files),
                None,
                "Без main.rs точку входу знайти неможливо"
            );
        }
    }

    mod cargo_toml {
        use super::*;

        /// Тест 10: Коректно парситься стандартний Cargo.toml.
        #[test]
        fn parse_standard_name() {
            let content = r#"
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"
"#;
            assert_eq!(parse_package_name(content), "my-project");
        }

        /// Тест 11: Парситься назва пакету без зайвих пробілів.
        #[test]
        fn parse_name_with_spaces() {
            let content = "name =   \"hello_world\"  \nversion = \"0.1.0\"";
            assert_eq!(parse_package_name(content), "hello_world");
        }

        /// Тест 12: Якщо Cargo.toml не містить поля `name` — повертається "app".
        #[test]
        fn missing_name_returns_default() {
            let content = "[package]\nversion = \"0.1.0\"";
            assert_eq!(
                parse_package_name(content),
                "app",
                "За відсутності поля name має повертатися значення за замовчуванням 'app'"
            );
        }

        /// Тест 13: Порожній Cargo.toml повертає значення за замовчуванням.
        #[test]
        fn empty_content_returns_default() {
            assert_eq!(parse_package_name(""), "app");
        }
    }
}
