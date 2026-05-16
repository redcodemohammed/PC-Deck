use axum::Json;use crate::models::HealthResponse;
pub async fn health()->Json<HealthResponse>{Json(HealthResponse{ok:true,name:"PC Deck Daemon".into(),version:"0.1.0".into(),platform:std::env::consts::OS.into()})}
