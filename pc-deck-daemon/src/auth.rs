use axum::http::HeaderMap;
use crate::{error::AppError, AppState};

pub async fn require_auth(headers: &HeaderMap, state: &AppState) -> Result<(), AppError> {
    let token = headers.get("x-pcdeck-token").and_then(|v| v.to_str().ok()).ok_or(AppError::Unauthorized)?;
    if state.store.is_valid_token(token)? { Ok(()) } else { Err(AppError::Unauthorized) }
}
