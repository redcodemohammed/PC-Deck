use std::process::{Command, Stdio};

use axum::{
    extract::{Query, State},
    http::HeaderMap,
    Json,
};
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::{auth::require_auth, error::AppError, AppState};

#[derive(Debug, Deserialize)]
pub struct NowPlayingQuery {
    pub player: Option<String>,
}

#[derive(Debug, Default, Serialize)]
pub struct NowPlayingResponse {
    pub playing: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub album: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub art_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub player: Option<String>,
}

pub async fn now_playing(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<NowPlayingQuery>,
) -> Result<Json<NowPlayingResponse>, AppError> {
    require_auth(&headers, &state).await?;
    Ok(Json(read_now_playing(q.player.as_deref())))
}

#[cfg(target_os = "linux")]
fn read_now_playing(player: Option<&str>) -> NowPlayingResponse {
    // playerctl metadata --format '{{status}}|{{title}}|{{artist}}|{{album}}|{{mpris:artUrl}}|{{playerName}}'
    let mut cmd = Command::new("playerctl");
    if let Some(p) = player {
        cmd.args(["--player", p]);
    }
    cmd.args([
        "metadata",
        "--format",
        "{{status}}|{{title}}|{{artist}}|{{album}}|{{mpris:artUrl}}|{{playerName}}",
    ]);
    let Ok(out) = cmd.output() else {
        return NowPlayingResponse::default()
    };
    if !out.status.success() {
        return NowPlayingResponse::default()
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let parts: Vec<&str> = s.split('|').collect();
    let playing = parts.first().map(|s| s.eq_ignore_ascii_case("Playing")).unwrap_or(false);
    NowPlayingResponse {
        playing,
        title: parts.get(1).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        artist: parts.get(2).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        album: parts.get(3).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        art_url: parts.get(4).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        player: parts.get(5).map(|s| s.to_string()).filter(|s| !s.is_empty()),
    }
}

#[cfg(target_os = "windows")]
fn read_now_playing(_player: Option<&str>) -> NowPlayingResponse {
    // Query GlobalSystemMediaTransportControlsSessionManager via PowerShell —
    // the same source Windows uses for its native "now playing" overlay.
    let script = r#"
$ErrorActionPreference = 'SilentlyContinue'
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
$mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
if (-not $mgr) { exit }
$session = $mgr.GetCurrentSession()
if (-not $session) { exit }
$props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
if (-not $props) { exit }
$status = $session.GetPlaybackInfo().PlaybackStatus.ToString()
$player = $session.SourceAppUserModelId
Write-Output "$status|$($props.Title)|$($props.Artist)|$($props.AlbumTitle)||$player"
"#;
    let Ok(out) = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
    else {
        return NowPlayingResponse::default()
    };
    if !out.status.success() {
        return NowPlayingResponse::default()
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if s.is_empty() {
        return NowPlayingResponse::default()
    }
    let parts: Vec<&str> = s.split('|').collect();
    let playing = parts.first().map(|s| s.eq_ignore_ascii_case("Playing")).unwrap_or(false);
    NowPlayingResponse {
        playing,
        title: parts.get(1).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        artist: parts.get(2).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        album: parts.get(3).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        art_url: parts.get(4).map(|s| s.to_string()).filter(|s| !s.is_empty()),
        player: parts.get(5).map(|s| s.to_string()).filter(|s| !s.is_empty()),
    }
}

#[cfg(not(any(target_os = "linux", target_os = "windows")))]
fn read_now_playing(_player: Option<&str>) -> NowPlayingResponse {
    // TODO: macOS via MediaRemote / `osascript`.
    NowPlayingResponse::default()
}

#[derive(Debug, Deserialize)]
pub struct NowPlayingControlRequest {
    /// "playpause" | "play" | "pause" | "next" | "prev" | "stop"
    pub action: String,
    #[serde(default)]
    pub player: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct NowPlayingControlResponse {
    pub ok: bool,
}

pub async fn now_playing_control(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<NowPlayingControlRequest>,
) -> Result<Json<NowPlayingControlResponse>, AppError> {
    require_auth(&headers, &state).await?;
    info!("now_playing/control: action={} player={:?}", req.action, req.player);
    run_player_control(&req.action, req.player.as_deref())?;
    Ok(Json(NowPlayingControlResponse { ok: true }))
}

#[cfg(target_os = "linux")]
fn run_player_control(action: &str, player: Option<&str>) -> Result<(), AppError> {
    let subcommand = match action {
        "playpause" | "play_pause" => "play-pause",
        "play" => "play",
        "pause" => "pause",
        "next" => "next",
        "prev" | "previous" => "previous",
        "stop" => "stop",
        other => return Err(AppError::BadRequest(format!("unknown control action: {other}"))),
    };
    let mut cmd = Command::new("playerctl");
    if let Some(p) = player {
        cmd.args(["--player", p]);
    }
    cmd.arg(subcommand);
    cmd.stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    cmd.spawn()
        .map(|_| ())
        .map_err(|e| AppError::Internal(format!("playerctl spawn failed: {e}")))
}

#[cfg(target_os = "windows")]
fn run_player_control(action: &str, _player: Option<&str>) -> Result<(), AppError> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};
    let key = match action {
        "playpause" | "play_pause" | "play" | "pause" => Key::MediaPlayPause,
        "next" => Key::MediaNextTrack,
        "prev" | "previous" => Key::MediaPrevTrack,
        "stop" => Key::MediaStop,
        other => return Err(AppError::BadRequest(format!("unknown control action: {other}"))),
    };
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| AppError::Internal(format!("enigo init: {e}")))?;
    enigo
        .key(key, Direction::Click)
        .map_err(|e| AppError::Internal(format!("enigo click: {e}")))
}

#[cfg(not(any(target_os = "linux", target_os = "windows")))]
fn run_player_control(_action: &str, _player: Option<&str>) -> Result<(), AppError> {
    Err(AppError::BadRequest(
        "now_playing control is not implemented on this platform".into(),
    ))
}
