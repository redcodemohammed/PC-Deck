use std::process::Command;

use axum::{
    extract::{Query, State},
    http::HeaderMap,
    Json,
};
use serde::{Deserialize, Serialize};

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

#[cfg(not(target_os = "linux"))]
fn read_now_playing(_player: Option<&str>) -> NowPlayingResponse {
    // TODO: macOS uses MediaRemote / `osascript`, Windows uses GlobalSystemMediaTransportControlsSessionManager.
    NowPlayingResponse::default()
}
