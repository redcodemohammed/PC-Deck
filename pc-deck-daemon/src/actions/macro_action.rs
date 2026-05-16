use std::time::Duration;

use enigo::{Enigo, Keyboard, Settings};
use serde_json::{json, Value};
use tokio::time::sleep;
use tracing::info;

use crate::{error::AppError, AppState};

use super::{hotkey, launch_app, open_url, shell_command};

/// Expected config shape: `{ "macro": { "steps": [ { type: "...", ...fields } ] } }`
/// Step types: "hotkey" | "delay" | "text" | "open_url" | "launch_app" | "shell_command"
pub async fn run(_state: &AppState, config: &Value, allow_shell: bool) -> Result<(), AppError> {
    let macro_obj = config
        .get("macro")
        .ok_or_else(|| AppError::BadRequest("macro: missing 'macro'".into()))?;
    let steps = macro_obj
        .get("steps")
        .and_then(Value::as_array)
        .ok_or_else(|| AppError::BadRequest("macro: missing 'macro.steps'".into()))?;

    for (i, step) in steps.iter().enumerate() {
        let step_type = step
            .get("type")
            .and_then(Value::as_str)
            .ok_or_else(|| AppError::BadRequest(format!("macro: step {i} missing 'type'")))?;
        info!("macro step {i}: {step_type}");
        match step_type {
            "hotkey" => {
                let cfg = json!({ "hotkey": step.get("hotkey") });
                hotkey::run(&cfg).await?;
            }
            "delay" => {
                let ms = step.get("ms").and_then(Value::as_u64).unwrap_or(0);
                sleep(Duration::from_millis(ms)).await;
            }
            "text" => {
                let text = step.get("text").and_then(Value::as_str).unwrap_or("");
                if !text.is_empty() {
                    let mut enigo = Enigo::new(&Settings::default())
                        .map_err(|e| AppError::Internal(format!("macro/text: enigo init: {e}")))?;
                    enigo
                        .text(text)
                        .map_err(|e| AppError::Internal(format!("macro/text: type: {e}")))?;
                }
            }
            "open_url" => {
                let url = step.get("url").cloned().unwrap_or_default();
                open_url::run(&json!({ "url": url })).await?;
            }
            "launch_app" => {
                let app = step.get("app").cloned().unwrap_or_default();
                launch_app::run(&json!({ "app": app })).await?;
            }
            "shell_command" => {
                if !allow_shell {
                    return Err(AppError::BadRequest(
                        "macro: shell_command step requires allow_shell_command in daemon config".into(),
                    ))
                }
                let command = step.get("command").cloned().unwrap_or_default();
                shell_command::run(&json!({ "command": command })).await?;
            }
            other => {
                return Err(AppError::BadRequest(format!(
                    "macro: unsupported step type '{other}' at index {i}"
                )))
            }
        }
    }
    Ok(())
}
