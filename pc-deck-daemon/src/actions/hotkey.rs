use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use serde_json::Value;
use tracing::info;

use crate::error::AppError;

/// Expected config shape: `{ "hotkey": { "modifiers": ["ctrl","shift","alt","meta"], "key": "A" } }`
pub async fn run(config: &Value) -> Result<(), AppError> {
    let hk = config
        .get("hotkey")
        .ok_or_else(|| AppError::BadRequest("hotkey: missing 'hotkey'".into()))?;
    let key_name = hk
        .get("key")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::BadRequest("hotkey: missing 'hotkey.key'".into()))?;
    if key_name.is_empty() {
        return Err(AppError::BadRequest("hotkey: empty key".into()));
    }
    let modifiers: Vec<String> = hk
        .get("modifiers")
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_lowercase()))
                .collect()
        })
        .unwrap_or_default();

    info!("hotkey: modifiers={:?} key={}", modifiers, key_name);

    let key = parse_key(key_name)
        .ok_or_else(|| AppError::BadRequest(format!("hotkey: unsupported key '{key_name}'")))?;

    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| AppError::Internal(format!("hotkey: enigo init failed: {e}")))?;

    let mod_keys: Vec<Key> = modifiers
        .iter()
        .filter_map(|m| match m.as_str() {
            "ctrl" => Some(Key::Control),
            "shift" => Some(Key::Shift),
            "alt" => Some(Key::Alt),
            "meta" | "cmd" | "super" | "win" => Some(Key::Meta),
            _ => None,
        })
        .collect();

    for k in &mod_keys {
        enigo
            .key(*k, Direction::Press)
            .map_err(|e| AppError::Internal(format!("hotkey: press modifier: {e}")))?;
    }
    let click_result = enigo.key(key, Direction::Click);
    for k in mod_keys.iter().rev() {
        let _ = enigo.key(*k, Direction::Release);
    }
    click_result.map_err(|e| AppError::Internal(format!("hotkey: click key: {e}")))?;
    Ok(())
}

fn parse_key(name: &str) -> Option<Key> {
    let upper = name.to_uppercase();
    if let Some(rest) = upper.strip_prefix('F') {
        if let Ok(n) = rest.parse::<u32>() {
            return match n {
                1 => Some(Key::F1),
                2 => Some(Key::F2),
                3 => Some(Key::F3),
                4 => Some(Key::F4),
                5 => Some(Key::F5),
                6 => Some(Key::F6),
                7 => Some(Key::F7),
                8 => Some(Key::F8),
                9 => Some(Key::F9),
                10 => Some(Key::F10),
                11 => Some(Key::F11),
                12 => Some(Key::F12),
                _ => None,
            }
        }
    }
    match upper.as_str() {
        "ENTER" | "RETURN" => Some(Key::Return),
        "ESC" | "ESCAPE" => Some(Key::Escape),
        "TAB" => Some(Key::Tab),
        "SPACE" => Some(Key::Space),
        "BACKSPACE" => Some(Key::Backspace),
        "DELETE" | "DEL" => Some(Key::Delete),
        "UP" => Some(Key::UpArrow),
        "DOWN" => Some(Key::DownArrow),
        "LEFT" => Some(Key::LeftArrow),
        "RIGHT" => Some(Key::RightArrow),
        "HOME" => Some(Key::Home),
        "END" => Some(Key::End),
        "PAGEUP" => Some(Key::PageUp),
        "PAGEDOWN" => Some(Key::PageDown),
        "MEDIAPLAYPAUSE" | "PLAYPAUSE" => Some(Key::MediaPlayPause),
        "MEDIANEXT" | "MEDIANEXTTRACK" | "NEXTTRACK" => Some(Key::MediaNextTrack),
        "MEDIAPREV" | "MEDIAPREVTRACK" | "PREVTRACK" => Some(Key::MediaPrevTrack),
        "MEDIASTOP" => Some(Key::MediaStop),
        "VOLUMEUP" => Some(Key::VolumeUp),
        "VOLUMEDOWN" => Some(Key::VolumeDown),
        "VOLUMEMUTE" | "MUTE" => Some(Key::VolumeMute),
        s if s.chars().count() == 1 => {
            let ch = s.chars().next().unwrap();
            Some(Key::Unicode(ch.to_ascii_lowercase()))
        }
        _ => None,
    }
}
