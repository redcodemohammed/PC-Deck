use axum::{extract::State, Json};use crate::AppState;
pub async fn status(State(state):State<AppState>)->Json<serde_json::Value>{let cfg=state.config.read().await; Json(serde_json::json!({"pairedDevicesKnown": true, "shellCommandEnabled": cfg.allow_shell_command}))}
