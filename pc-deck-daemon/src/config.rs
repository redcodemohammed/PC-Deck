use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DaemonConfig { pub pairing_code: String, pub desktop_name: String, pub allow_shell_command: bool }
impl Default for DaemonConfig { fn default() -> Self { Self { pairing_code: format!("{:06}", rand::thread_rng().gen_range(0..=999999)), desktop_name: whoami::fallible::hostname().unwrap_or_else(|_| "Desktop".into()), allow_shell_command: false } } }
impl DaemonConfig { pub fn load_or_default() -> std::io::Result<Self> { let p = config_path()?; if p.exists() { Ok(serde_json::from_str(&fs::read_to_string(p)?)?) } else { let cfg=Self::default(); cfg.save()?; Ok(cfg) } }
pub fn save(&self)->std::io::Result<()> { let p=config_path()?; if let Some(d)=p.parent(){fs::create_dir_all(d)?;} fs::write(p, serde_json::to_string_pretty(self)?) }
}
pub fn base_dir() -> std::io::Result<PathBuf> { Ok(dirs::home_dir().unwrap().join(".pc-deck")) }
pub fn config_path() -> std::io::Result<PathBuf> { Ok(base_dir()?.join("config.json")) }
