/// Модульні тести для домену auth.
/// Усі тести викликають реальні функції з `auth::service`, а не їх копії,
/// щоб ловити регресії в production-коді.
#[cfg(test)]
mod tests {
    use uuid::Uuid;

    use crate::app::domains::auth::service::{
        create_token, validate_password, validate_token, validate_username,
    };

    mod jwt {
        use super::*;

        /// Тест 1: Токен, згенерований з правильним секретом, успішно валідується.
        #[test]
        fn valid_token_is_accepted() {
            let secret = "test_super_secret_key";
            let user_id = Uuid::new_v4();
            let username = "test_user";

            let token = create_token(user_id, username, secret).expect("Генерація токена не повинна провалюватися");
            let result = validate_token(&token, secret);

            assert!(result.is_ok(), "Валідний токен повинен успішно пройти перевірку");

            let claims = result.unwrap();
            assert_eq!(claims.sub, user_id, "sub claim повинен збігатися з user_id");
            assert_eq!(claims.username, username, "username claim повинен збігатися");
        }

        /// Тест 2: Токен, підписаний одним секретом, відхиляється при перевірці іншим секретом.
        #[test]
        fn wrong_secret_is_rejected() {
            let correct_secret = "correct_secret_key_123";
            let wrong_secret = "wrong_secret_key_456";
            let user_id = Uuid::new_v4();

            let token = create_token(user_id, "some_user", correct_secret).unwrap();
            let result = validate_token(&token, wrong_secret);

            assert!(
                result.is_err(),
                "Токен, підписаний іншим секретом, повинен бути відхилений"
            );
        }

        /// Тест 3: Порожній рядок відхиляється як невалідний токен.
        #[test]
        fn empty_string_is_rejected() {
            let result = validate_token("", "any_secret");
            assert!(result.is_err(), "Порожній рядок не є валідним JWT-токеном");
        }

        /// Тест 4: Довільний рядок-сміття відхиляється як невалідний токен.
        #[test]
        fn garbage_string_is_rejected() {
            let result = validate_token("this_is_not.a_jwt.token!!!", "any_secret");
            assert!(result.is_err(), "Рядок-сміття не є валідним JWT-токеном");
        }

        /// Тест 5: Токен зберігає правильний user_id у claim `sub`.
        #[test]
        fn claims_contain_correct_user_id() {
            let secret = "stable_secret";
            let expected_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();

            let token = create_token(expected_id, "alice", secret).unwrap();
            let claims = validate_token(&token, secret).unwrap();

            assert_eq!(
                claims.sub, expected_id,
                "user_id у JWT claim повинен точно збігатися з переданим при генерації"
            );
        }
    }

    mod validation {
        use super::*;

        /// Тест 6: Коректне ім'я користувача (довжина >= 3) проходить валідацію.
        #[test]
        fn username_valid_length() {
            assert!(validate_username("bob").is_ok(), "Ім'я з 3 символів є валідним");
            assert!(validate_username("alice").is_ok(), "Ім'я з 5 символів є валідним");
            assert!(validate_username("user_name_123").is_ok(), "Довге ім'я є валідним");
        }

        /// Тест 7: Занадто коротке ім'я (< 3 символів) відхиляється.
        #[test]
        fn username_too_short_is_rejected() {
            assert!(validate_username("ab").is_err(), "Ім'я з 2 символів занадто коротке");
            assert!(validate_username("a").is_err(), "Ім'я з 1 символу занадто коротке");
        }

        /// Тест 8: Порожнє ім'я відхиляється.
        #[test]
        fn username_empty_is_rejected() {
            assert!(validate_username("").is_err(), "Порожнє ім'я є недійсним");
        }

        /// Тест 9: Коректний пароль (довжина >= 6) проходить валідацію.
        #[test]
        fn password_valid_length() {
            assert!(validate_password("secret").is_ok(), "Пароль з 6 символів є валідним");
            assert!(validate_password("strongpassword123!").is_ok(), "Довгий пароль є валідним");
        }

        /// Тест 10: Занадто короткий пароль (< 6 символів) відхиляється.
        #[test]
        fn password_too_short_is_rejected() {
            assert!(validate_password("12345").is_err(), "Пароль з 5 символів занадто короткий");
            assert!(validate_password("").is_err(), "Порожній пароль є недійсним");
        }
    }
}
