use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deck { pub id: String, pub name: String, pub rows: u8, pub columns: u8, pub buttons: Vec<DeckButton>, pub created_at: String, pub updated_at: String }
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeckButton { pub id: String, pub row: u8, pub column: u8, pub label: String, pub icon: String, pub color: Option<String>, pub action: Option<ActionDefinition> }
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionDefinition { pub id: String, #[serde(rename="type")] pub action_type: String, pub name: String, pub config: Value }
#[derive(Debug, Serialize)] pub struct HealthResponse { pub ok: bool, pub name: String, pub version: String, pub platform: String }
#[derive(Debug, Deserialize)] pub struct PairRequest { #[serde(rename="pairingCode")] pub pairing_code: String, #[serde(rename="deviceName")] pub device_name: String }
#[derive(Debug, Serialize)] pub struct PairResponse { pub token: String, #[serde(rename="desktopName")] pub desktop_name: String }
#[derive(Debug, Deserialize)] pub struct ExecuteActionRequest { #[serde(rename="actionId")] pub action_id: String, #[serde(rename="deckId")] pub deck_id: String, #[serde(rename="buttonId")] pub button_id: String }
#[derive(Debug, Serialize)] pub struct ExecuteActionResponse { pub ok: bool, #[serde(rename="executedAt")] pub executed_at: String }
#[derive(Debug, Clone, Serialize, Deserialize)] pub struct DeviceRecord { pub name: String, pub token: String, pub paired_at: String }
#[derive(Debug, Clone, Serialize, Deserialize)] pub struct WsEvent { #[serde(rename="type")] pub event_type: String, pub payload: Value }

pub fn now() -> String { Utc::now().to_rfc3339() }
