mod common;

use std::collections::HashMap;
use common::models::{TestExecuteProjectRequest, TestExecutionResponse};

#[tokio::test]
async fn test_execute_code_via_api() {
    let Some(app) = common::app::spawn_app().await else {
        eprintln!("Skipping test: Database/Redis are unreachable.");
        return;
    };

    let client = reqwest::Client::new();
    let doc_id = uuid::Uuid::new_v4();
    let mut files = HashMap::new();
    files.insert("main.rs".to_string(), r#"
        fn main() {
            println!("Output from integration test!");
        }
    "#.to_string());

    let payload = TestExecuteProjectRequest { files };

    let response = client
        .post(&format!("{}/api/documents/{}/execute", app.address, doc_id))
        .json(&payload)
        .send()
        .await
        .expect("Failed to send code execution request");

    assert_eq!(response.status(), 200, "Code execution should return 200 OK");
    let run_res: TestExecutionResponse = response.json().await.expect("Failed to parse execution response");
    assert!(run_res.success, "Code execution should succeed");
    assert!(run_res.stdout.contains("Output from integration test!"), "Stdout must contain expected text");
}
