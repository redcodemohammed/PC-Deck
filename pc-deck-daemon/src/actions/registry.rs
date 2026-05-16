use crate::{error::AppError, models::ExecuteActionRequest, AppState};use tracing::info;
pub async fn execute(_state:&AppState, req:&ExecuteActionRequest)->Result<(),AppError>{info!("Executing action {} on deck {} button {}",req.action_id,req.deck_id,req.button_id); Ok(())}
