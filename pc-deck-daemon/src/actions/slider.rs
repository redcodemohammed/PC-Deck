use std::process::{Command, Stdio};

use serde_json::Value;
use tracing::{info, warn};

use crate::error::AppError;

/// Apply a slider's value. `slider_config` is the opaque JSON object stored on the
/// button; we read its `bind` field to decide what to drive.
pub async fn apply(slider_config: Option<&Value>, value: f64) -> Result<(), AppError> {
    let bind = slider_config
        .and_then(|v| v.get("bind"))
        .and_then(Value::as_str)
        .unwrap_or("custom");
    info!("slider: bind={} value={}", bind, value);
    match bind {
        "volume" => set_volume(value),
        "brightness" => set_brightness(value),
        "custom" => Ok(()),
        other => {
            warn!("slider: unknown bind '{}' — ignoring", other);
            Ok(())
        }
    }
}

fn clamp_percent(value: f64) -> u32 {
    let v = value.round();
    v.clamp(0.0, 100.0) as u32
}

#[cfg(target_os = "linux")]
fn set_volume(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    spawn("pactl", &["set-sink-volume", "@DEFAULT_SINK@", &format!("{pct}%")])
}

#[cfg(target_os = "macos")]
fn set_volume(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    spawn(
        "osascript",
        &["-e", &format!("set volume output volume {pct}")],
    )
}

#[cfg(target_os = "windows")]
fn set_volume(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    // nircmd is a common helper but not bundled; fall back to a PowerShell call
    // that nudges volume via SendKeys is unreliable, so we just no-op with a log.
    info!("slider/volume: target {}% — Windows volume requires nircmd or similar", pct);
    Ok(())
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
fn set_volume(_value: f64) -> Result<(), AppError> { Ok(()) }

#[cfg(target_os = "linux")]
fn set_brightness(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    spawn("brightnessctl", &["set", &format!("{pct}%")])
}

#[cfg(not(target_os = "linux"))]
fn set_brightness(value: f64) -> Result<(), AppError> {
    info!("slider/brightness: target {}% — handler not implemented for this OS", clamp_percent(value));
    Ok(())
}

fn spawn(program: &str, args: &[&str]) -> Result<(), AppError> {
    let mut cmd = Command::new(program);
    cmd.args(args).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    cmd.spawn()
        .map(|_| ())
        .map_err(|e| AppError::Internal(format!("slider: spawn {program} failed: {e}")))
}
