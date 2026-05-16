use std::{fs, path::PathBuf};

use crate::routes::apps::InstalledApp;

const APP_ROOTS: &[&str] = &["/Applications", "/System/Applications"];

pub fn installed_apps() -> Vec<InstalledApp> {
    let mut out = Vec::new();
    for root in APP_ROOTS {
        scan(&PathBuf::from(root), &mut out);
    }
    if let Some(home) = dirs::home_dir() {
        scan(&home.join("Applications"), &mut out);
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out.dedup_by(|a, b| a.name == b.name);
    out
}

fn scan(dir: &std::path::Path, out: &mut Vec<InstalledApp>) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let Some(name) = path.file_name().and_then(|s| s.to_str()) else { continue };
        if name.ends_with(".app") {
            let display = name.trim_end_matches(".app").to_string();
            out.push(InstalledApp {
                id: path.to_string_lossy().to_string(),
                name: display,
                path: path.to_string_lossy().to_string(),
                icon_png: None,
            });
        }
    }
}
