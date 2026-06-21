mod common;

#[tokio::test]
async fn test_server_starts_and_swagger_ui_is_accessible() {
    let Some(app) = common::app::spawn_app().await else {
        eprintln!("Skipping test: Database/Redis are unreachable.");
        return;
    };

    let client = reqwest::Client::new();
    let response = client
        .get(&format!("{}/swagger-ui/", app.address))
        .send()
        .await
        .expect("Failed to execute request.");

    assert!(response.status().is_success(), "Swagger UI should be accessible");
    let text = response.text().await.unwrap();
    assert!(text.contains("swagger-ui"), "Page should contain swagger-ui marker");
}
