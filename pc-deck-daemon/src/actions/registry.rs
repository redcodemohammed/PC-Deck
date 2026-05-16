use tracing::{info, warn};

use crate::{error::AppError, models::ExecuteActionRequest, AppState};

use super::{hotkey, launch_app, macro_action, open_url, shell_command};

pub async fn execute(state: &AppState, req: &ExecuteActionRequest) -> Result<(), AppError> {
    info!(
        "Executing action {} on deck {} button {}",
        req.action_id, req.deck_id, req.button_id
    );

    let button = state
        .store
        .find_button(&req.deck_id, &req.button_id)?
        .ok_or(AppError::NotFound)?;
    let action = button.action.ok_or(AppError::BadRequest(
        "button has no action attached".into(),
    ))?;

    if action.id != req.action_id {
        warn!(
            "Action id mismatch: expected {} on button, got {} in request",
            action.id, req.action_id
        );
    }

    let allow_shell = state.config.read().await.allow_shell_command;

    match action.action_type.as_str() {
        "hotkey" => hotkey::run(&action.config).await,
        "launch_app" => launch_app::run(&action.config).await,
        "open_url" => open_url::run(&action.config).await,
        "shell_command" => {
            if !allow_shell {
                return Err(AppError::BadRequest(
                    "shell commands are disabled in daemon config".into(),
                ));
            }
            shell_command::run(&action.config).await
        }
        "macro" => macro_action::run(state, &action.config, allow_shell).await,
        other => Err(AppError::BadRequest(format!("unknown action type: {other}"))),
    }
}
