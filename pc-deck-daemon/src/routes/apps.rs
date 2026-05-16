use axum::{extract::State, http::HeaderMap, Json};
use crate::{auth::require_auth, error::AppError, AppState};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct InstalledApp {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "iconPng")]
    pub icon_png: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AppsResponse {
    pub apps: Vec<InstalledApp>,
}

pub async fn list_apps(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<AppsResponse>, AppError> {
    require_auth(&headers, &state).await?;
    let apps = crate::platform::installed_apps();
    Ok(Json(AppsResponse { apps }))
}
