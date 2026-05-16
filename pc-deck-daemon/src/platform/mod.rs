use crate::routes::apps::InstalledApp;

#[cfg(target_os = "windows")]
pub mod windows;
#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "macos")]
pub mod macos;

/// Best-effort list of installed apps for the host platform.
/// Per-platform modules return a flat list of `{ id, name, path, iconPng? }`.
/// Icon enumeration is left as a TODO; mobile renders its own fallback when missing.
pub fn installed_apps() -> Vec<InstalledApp> {
    #[cfg(target_os = "windows")]
    {
        windows::installed_apps()
    }
    #[cfg(target_os = "linux")]
    {
        linux::installed_apps()
    }
    #[cfg(target_os = "macos")]
    {
        macos::installed_apps()
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        Vec::new()
    }
}
