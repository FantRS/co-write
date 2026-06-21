mod common;

use common::models::{TestRegisterRequest, TestAuthResponse};
use futures_util::future::join_all;
use std::time::Instant;

#[tokio::test]
async fn test_concurrent_load_auth_and_documents() {
    let Some(app) = common::app::spawn_app().await else {
        eprintln!("Skipping test: Database/Redis are unreachable.");
        return;
    };

    let client = reqwest::Client::new();
    let num_users = 20; // Кількість одночасних користувачів для тесту
    let mut tasks = Vec::new();

    let start_time = Instant::now();

    for i in 0..num_users {
        let app_address = app.address.clone();
        let client_clone = client.clone();

        let task = tokio::spawn(async move {
            let username = format!("load_user_{}_{}", i, rand::random::<u32>());
            let register_payload = TestRegisterRequest {
                username: username.clone(),
                password: "secure_password_123".to_string(),
            };

            // 1. Реєстрація користувача
            let reg_resp = client_clone
                .post(&format!("{}/api/auth/register", app_address))
                .json(&register_payload)
                .send()
                .await
                .ok()?;

            if reg_resp.status() != 201 {
                return None;
            }

            let auth_data: TestAuthResponse = reg_resp.json().await.ok()?;

            // 2. Отримання списку документів з JWT токеном
            let doc_resp = client_clone
                .get(&format!("{}/api/documents", app_address))
                .header("Authorization", format!("Bearer {}", auth_data.token))
                .send()
                .await
                .ok()?;

            if doc_resp.status() == 200 {
                Some(Instant::now())
            } else {
                None
            }
        });

        tasks.push(task);
    }

    // Очікуємо завершення всіх віртуальних користувачів
    let results = join_all(tasks).await;
    let duration = start_time.elapsed();

    let mut successful_users = 0;
    for res in results {
        if let Ok(Some(_)) = res {
            successful_users += 1;
        }
    }

    println!(
        "НАВАНТАЖЕННЯ: {} з {} користувачів пройшли цикл за {:?}",
        successful_users, num_users, duration
    );

    // Всі 100% користувачів повинні успішно пройти цикл без помилок з'єднання чи взаємоблокувань (deadlocks)
    assert_eq!(
        successful_users, num_users,
        "Не всі користувачі змогли успішно зареєструватися та отримати документи під навантаженням"
    );
}
