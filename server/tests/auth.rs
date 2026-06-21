mod common;

use common::models::{TestRegisterRequest, TestLoginRequest, TestAuthResponse};

#[tokio::test]
async fn test_register_and_login_flow() {
    let Some(app) = common::app::spawn_app().await else {
        eprintln!("Skipping test: Database/Redis are unreachable.");
        return;
    };

    let client = reqwest::Client::new();

    // 1. Generate a random username to avoid collisions
    let random_username = format!("user_{}", rand::random::<u32>());
    let register_payload = TestRegisterRequest {
        username: random_username.clone(),
        password: "securepassword123".to_string(),
    };

    // 2. Send registration request
    let response = client
        .post(&format!("{}/api/auth/register", app.address))
        .json(&register_payload)
        .send()
        .await
        .expect("Failed to send register request");

    assert_eq!(response.status(), 201, "Registration should return 201 Created");
    let auth_res: TestAuthResponse = response.json().await.expect("Failed to parse AuthResponse");
    assert_eq!(auth_res.username, random_username);
    assert!(!auth_res.token.is_empty(), "Token must not be empty");

    // 3. Send login request
    let login_payload = TestLoginRequest {
        username: random_username.clone(),
        password: "securepassword123".to_string(),
    };

    let response = client
        .post(&format!("{}/api/auth/login", app.address))
        .json(&login_payload)
        .send()
        .await
        .expect("Failed to send login request");

    assert_eq!(response.status(), 200, "Login should return 200 OK");
    let login_res: TestAuthResponse = response.json().await.expect("Failed to parse login response");
    assert_eq!(login_res.username, random_username);
    assert!(!login_res.token.is_empty(), "Token must not be empty");
}

#[tokio::test]
async fn test_register_duplicate_username_fails() {
    let Some(app) = common::app::spawn_app().await else {
        eprintln!("Skipping test: Database/Redis are unreachable.");
        return;
    };

    let client = reqwest::Client::new();
    let random_username = format!("user_{}", rand::random::<u32>());
    let register_payload = TestRegisterRequest {
        username: random_username.clone(),
        password: "securepassword123".to_string(),
    };

    // 1. First registration should succeed
    let response = client
        .post(&format!("{}/api/auth/register", app.address))
        .json(&register_payload)
        .send()
        .await
        .expect("Failed to send first register request");
    assert_eq!(response.status(), 201, "First registration should succeed");

    // 2. Second registration with the same username should return 409 Conflict
    let response = client
        .post(&format!("{}/api/auth/register", app.address))
        .json(&register_payload)
        .send()
        .await
        .expect("Failed to send second register request");
    assert_eq!(response.status(), 409, "Duplicate registration should return 409 Conflict");
}

