use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;

fn default_span() -> u8 { 1 }
fn is_default_span(n: &u8) -> bool { *n == 1 }
fn is_zero(n: &u8) -> bool { *n == 0 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deck {
    pub id: String,
    pub name: String,
    pub rows: u8,
    pub columns: u8,
    pub buttons: Vec<DeckButton>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeckButton {
    pub id: String,
    #[serde(default, skip_serializing_if = "is_zero")]
    pub page: u8,
    pub row: u8,
    pub column: u8,
    #[serde(default = "default_span", skip_serializing_if = "is_default_span", rename = "rowSpan")]
    pub row_span: u8,
    #[serde(default = "default_span", skip_serializing_if = "is_default_span", rename = "colSpan")]
    pub col_span: u8,
    pub label: String,
    pub icon: String,
    #[serde(default)]
    pub color: Option<String>,
    /// "button" | "toggle" | "slider"; absent means plain button.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    #[serde(default)]
    pub action: Option<ActionDefinition>,
    /// Toggle config — opaque to the daemon storage layer (action handlers read it).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub toggle: Option<Value>,
    /// Slider config — opaque pass-through; the slider route reads `bind` etc.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slider: Option<Value>,
    /// Widget config — opaque pass-through for mobile clients.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub widget: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionDefinition {
    pub id: String,
    #[serde(rename = "type")]
    pub action_type: String,
    pub name: String,
    pub config: Value,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub ok: bool,
    pub name: String,
    pub version: String,
    pub platform: String,
}

#[derive(Debug, Deserialize)]
pub struct PairRequest {
    #[serde(rename = "pairingCode")]
    pub pairing_code: String,
    #[serde(rename = "deviceName")]
    pub device_name: String,
}

#[derive(Debug, Serialize)]
pub struct PairResponse {
    pub token: String,
    #[serde(rename = "desktopName")]
    pub desktop_name: String,
}

#[derive(Debug, Deserialize)]
pub struct ExecuteActionRequest {
    #[serde(rename = "actionId")]
    pub action_id: String,
    #[serde(rename = "deckId")]
    pub deck_id: String,
    #[serde(rename = "buttonId")]
    pub button_id: String,
}

#[derive(Debug, Serialize)]
pub struct ExecuteActionResponse {
    pub ok: bool,
    #[serde(rename = "executedAt")]
    pub executed_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SliderValueRequest {
    #[serde(rename = "deckId")]
    pub deck_id: String,
    #[serde(rename = "buttonId")]
    pub button_id: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceRecord {
    pub name: String,
    pub token: String,
    pub paired_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub payload: Value,
}

pub fn now() -> String {
    Utc::now().to_rfc3339()
}
