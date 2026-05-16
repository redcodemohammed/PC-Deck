use serde_json::Value;
use tracing::info;

use crate::error::AppError;

/// Expected config shape: `{ "url": "https://..." }`
pub async fn run(config: &Value) -> Result<(), AppError> {
    let url = config
        .get("url")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::BadRequest("open_url: missing 'url'".into()))?;
    if url.is_empty() {
        return Err(AppError::BadRequest("open_url: empty 'url'".into()));
    }
    info!("open_url: {}", url);
    webbrowser::open(url).map_err(|e| AppError::Internal(format!("open_url: {e}")))?;
    Ok(())
}
