#![allow(dead_code)]

use std::collections::HashMap;

#[derive(serde::Serialize)]
pub struct TestRegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(serde::Serialize)]
pub struct TestLoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(serde::Deserialize, Debug)]
pub struct TestAuthResponse {
    pub token: String,
    pub username: String,
    pub user_id: uuid::Uuid,
}

#[derive(serde::Serialize)]
pub struct TestExecuteProjectRequest {
    pub files: HashMap<String, String>,
}

#[derive(serde::Deserialize, Debug)]
pub struct TestExecutionResponse {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}
