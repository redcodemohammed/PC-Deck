pub mod hotkey;
pub mod launch_app;
pub mod macro_action;
pub mod open_url;
pub mod registry;
pub mod shell_command;
pub mod slider;

pub async fn types() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!(["hotkey", "launch_app", "open_url", "shell_command", "macro"]))
}
