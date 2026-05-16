use std::process::{Command, Stdio};

use serde_json::Value;
use tracing::info;

use crate::error::AppError;

/// Expected config shape: `{ "command": "..." }`
pub async fn run(config: &Value) -> Result<(), AppError> {
    let command = config
        .get("command")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::BadRequest("shell_command: missing 'command'".into()))?;
    if command.is_empty() {
        return Err(AppError::BadRequest("shell_command: empty 'command'".into()));
    }
    info!("shell_command: {}", command);

    #[cfg(target_os = "windows")]
    let mut cmd = {
        let mut c = Command::new("cmd");
        c.args(["/C", command]);
        c
    };
    #[cfg(not(target_os = "windows"))]
    let mut cmd = {
        let mut c = Command::new("sh");
        c.args(["-c", command]);
        c
    };

    cmd.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    cmd.spawn()
        .map(|_| ())
        .map_err(|e| AppError::Internal(format!("shell_command: spawn failed: {e}")))
}
