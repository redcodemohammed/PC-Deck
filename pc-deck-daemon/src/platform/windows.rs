use std::{fs, path::PathBuf};

use crate::routes::apps::InstalledApp;

pub fn installed_apps() -> Vec<InstalledApp> {
    let mut roots: Vec<PathBuf> = Vec::new();
    if let Ok(appdata) = std::env::var("APPDATA") {
        roots.push(PathBuf::from(appdata).join("Microsoft/Windows/Start Menu/Programs"));
    }
    if let Ok(programdata) = std::env::var("ProgramData") {
        roots.push(PathBuf::from(programdata).join("Microsoft/Windows/Start Menu/Programs"));
    }
    let mut out = Vec::new();
    for root in roots {
        walk(&root, &mut out);
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out.dedup_by(|a, b| a.name == b.name);
    out
}

fn walk(dir: &std::path::Path, out: &mut Vec<InstalledApp>) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let ft = entry.file_type();
        if matches!(&ft, Ok(t) if t.is_dir()) {
            walk(&path, out);
            continue;
        }
        if path.extension().and_then(|s| s.to_str()).map(|s| s.eq_ignore_ascii_case("lnk")).unwrap_or(false) {
            let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("App").to_string();
            out.push(InstalledApp {
                id: path.to_string_lossy().to_string(),
                name,
                path: path.to_string_lossy().to_string(),
                icon_png: None,
            });
        }
    }
}
