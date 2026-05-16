use std::process::{Command, Stdio};

use serde_json::Value;
use tracing::info;

use crate::error::AppError;

/// Expected config shape: `{ "app": { "path": "<command>", "args"?: ["..."], "name"?: "..." } }`
pub async fn run(config: &Value) -> Result<(), AppError> {
    let app = config
        .get("app")
        .ok_or_else(|| AppError::BadRequest("launch_app: missing 'app'".into()))?;

    let path = app
        .get("path")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::BadRequest("launch_app: missing 'app.path'".into()))?;
    if path.is_empty() {
        return Err(AppError::BadRequest("launch_app: empty 'app.path'".into()));
    }

    let args: Vec<String> = app
        .get("args")
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default();

    let (program, prefix_args) = resolve_program(path);

    info!("launch_app: spawning {} {:?}", program, prefix_args);

    let mut cmd = Command::new(&program);
    cmd.args(&prefix_args).args(&args);
    cmd.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());

    cmd.spawn()
        .map(|_| ())
        .map_err(|e| AppError::Internal(format!("launch_app: spawn failed: {e}")))
}

#[cfg(target_os = "linux")]
fn resolve_program(path: &str) -> (String, Vec<String>) {
    (path.to_string(), Vec::new())
}

#[cfg(target_os = "macos")]
fn resolve_program(path: &str) -> (String, Vec<String>) {
    if path.ends_with(".app") || path.starts_with('/') {
        ("/usr/bin/open".to_string(), vec![path.to_string()])
    } else {
        (path.to_string(), Vec::new())
    }
}

#[cfg(target_os = "windows")]
fn resolve_program(path: &str) -> (String, Vec<String>) {
    if path.to_lowercase().ends_with(".lnk") {
        (
            "cmd".to_string(),
            vec!["/C".to_string(), "start".to_string(), "".to_string(), path.to_string()],
        )
    } else {
        (path.to_string(), Vec::new())
    }
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
fn resolve_program(path: &str) -> (String, Vec<String>) {
    (path.to_string(), Vec::new())
}
