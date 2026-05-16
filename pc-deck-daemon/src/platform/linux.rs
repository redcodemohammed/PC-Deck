use std::{fs, path::Path};

use crate::routes::apps::InstalledApp;

const DESKTOP_DIRS: &[&str] = &[
    "/usr/share/applications",
    "/usr/local/share/applications",
    "/var/lib/flatpak/exports/share/applications",
];

pub fn installed_apps() -> Vec<InstalledApp> {
    let user = dirs::home_dir().map(|h| h.join(".local/share/applications"));
    let mut out = Vec::new();
    for dir in DESKTOP_DIRS.iter().map(Path::new).chain(user.iter().map(|p| p.as_path())) {
        if !dir.exists() {
            continue;
        }
        let Ok(entries) = fs::read_dir(dir) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) != Some("desktop") {
                continue;
            }
            let Ok(text) = fs::read_to_string(&path) else { continue };
            if let Some(app) = parse_desktop_file(&text, &path) {
                out.push(app);
            }
        }
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out.dedup_by(|a, b| a.name == b.name);
    out
}

fn parse_desktop_file(text: &str, path: &Path) -> Option<InstalledApp> {
    let mut in_entry = false;
    let mut name: Option<String> = None;
    let mut exec: Option<String> = None;
    let mut no_display = false;
    let mut hidden = false;
    for line in text.lines() {
        let line = line.trim();
        if line.starts_with('[') {
            in_entry = line == "[Desktop Entry]";
            continue;
        }
        if !in_entry {
            continue;
        }
        if let Some(v) = line.strip_prefix("Name=") {
            name = Some(v.to_string());
        } else if let Some(v) = line.strip_prefix("Exec=") {
            exec = Some(v.to_string());
        } else if line == "NoDisplay=true" {
            no_display = true;
        } else if line == "Hidden=true" {
            hidden = true;
        }
    }
    if no_display || hidden {
        return None;
    }
    let name = name?;
    let exec = exec.unwrap_or_default();
    let exec_clean = exec
        .split_whitespace()
        .next()
        .unwrap_or("")
        .trim_matches('"')
        .to_string();
    Some(InstalledApp {
        id: path.file_stem().and_then(|s| s.to_str()).unwrap_or(&name).to_string(),
        name,
        path: exec_clean,
        icon_png: None,
    })
}
