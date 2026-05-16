use axum::{extract::State, http::HeaderMap, Json};

use crate::{
    actions::{registry::execute, slider},
    auth::require_auth,
    error::AppError,
    models::{ExecuteActionRequest, ExecuteActionResponse, SliderValueRequest, WsEvent},
    AppState,
};

pub async fn execute_action(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<ExecuteActionRequest>,
) -> Result<Json<ExecuteActionResponse>, AppError> {
    require_auth(&headers, &state).await?;
    execute(&state, &req).await?;
    let evt = WsEvent {
        event_type: "action_executed".into(),
        payload: serde_json::json!({"actionId": req.action_id, "ok": true}),
    };
    let _ = state.ws_tx.send(evt);
    Ok(Json(ExecuteActionResponse {
        ok: true,
        executed_at: crate::models::now(),
    }))
}

pub async fn set_slider(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<SliderValueRequest>,
) -> Result<Json<ExecuteActionResponse>, AppError> {
    require_auth(&headers, &state).await?;
    let button = state
        .store
        .find_button(&req.deck_id, &req.button_id)?
        .ok_or(AppError::NotFound)?;
    slider::apply(button.slider.as_ref(), req.value).await?;
    let evt = WsEvent {
        event_type: "slider_changed".into(),
        payload: serde_json::json!({
            "deckId": req.deck_id,
            "buttonId": req.button_id,
            "value": req.value,
        }),
    };
    let _ = state.ws_tx.send(evt);
    Ok(Json(ExecuteActionResponse {
        ok: true,
        executed_at: crate::models::now(),
    }))
}
