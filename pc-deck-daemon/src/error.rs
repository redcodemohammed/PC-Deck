use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;
use thiserror::Error;
#[derive(Error, Debug)]
pub enum AppError { #[error("unauthorized")] Unauthorized, #[error("not found")] NotFound, #[error("bad request: {0}")] BadRequest(String), #[error("internal: {0}")] Internal(String) }
impl IntoResponse for AppError { fn into_response(self) -> Response { let code = match self { AppError::Unauthorized => StatusCode::UNAUTHORIZED, AppError::NotFound => StatusCode::NOT_FOUND, AppError::BadRequest(_) => StatusCode::BAD_REQUEST, AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR}; (code, Json(json!({"error": self.to_string()}))).into_response() } }
