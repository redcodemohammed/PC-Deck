use std::process::{Command, Stdio};

use serde_json::Value;
use tracing::{info, warn};

use crate::error::AppError;

/// Apply a slider's value. `slider_config` is the opaque JSON object stored on the
/// button; we read its `bind` field to decide what to drive.
pub async fn apply(slider_config: Option<&Value>, value: f64) -> Result<(), AppError> {
    let bind = slider_config
        .and_then(|v| v.get("bind"))
        .and_then(Value::as_str)
        .unwrap_or("custom");
    info!("slider: bind={} value={}", bind, value);
    match bind {
        "volume" => set_volume(value),
        "brightness" => set_brightness(value),
        "custom" => Ok(()),
        other => {
            warn!("slider: unknown bind '{}' — ignoring", other);
            Ok(())
        }
    }
}

fn clamp_percent(value: f64) -> u32 {
    let v = value.round();
    v.clamp(0.0, 100.0) as u32
}

#[cfg(target_os = "linux")]
fn set_volume(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    spawn("pactl", &["set-sink-volume", "@DEFAULT_SINK@", &format!("{pct}%")])
}

#[cfg(target_os = "macos")]
fn set_volume(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    spawn(
        "osascript",
        &["-e", &format!("set volume output volume {pct}")],
    )
}

#[cfg(target_os = "windows")]
fn set_volume(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    // Uses Add-Type to call the Windows IAudioEndpointVolume COM API. Works on
    // any stock Windows install — no nircmd / AudioDeviceCmdlets needed.
    let level = pct as f32 / 100.0;
    let script = format!(
        r#"
$ErrorActionPreference = 'Stop'
Add-Type -Language CSharp -TypeDefinition @"
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {{
    int _a(); int _b(); int _c(); int _d();
    int SetMasterVolumeLevel(float fLevelDB, System.Guid pguidEventContext);
    int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
}}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {{
    int Activate(ref System.Guid id, int dwClsCtx, System.IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {{
    int _a();
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumeratorComObject {{ }}
public static class PcDeckAudio {{
    public static void SetVolume(float level) {{
        IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
        IMMDevice dev;
        Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out dev));
        var iid = typeof(IAudioEndpointVolume).GUID;
        object o;
        Marshal.ThrowExceptionForHR(dev.Activate(ref iid, 1, System.IntPtr.Zero, out o));
        IAudioEndpointVolume vol = (IAudioEndpointVolume)o;
        Marshal.ThrowExceptionForHR(vol.SetMasterVolumeLevelScalar(level, System.Guid.Empty));
    }}
}}
"@
[PcDeckAudio]::SetVolume({level:.4})
"#,
    );
    spawn("powershell", &["-NoProfile", "-NonInteractive", "-Command", &script])
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
fn set_volume(_value: f64) -> Result<(), AppError> { Ok(()) }

#[cfg(target_os = "linux")]
fn set_brightness(value: f64) -> Result<(), AppError> {
    let pct = clamp_percent(value);
    spawn("brightnessctl", &["set", &format!("{pct}%")])
}

#[cfg(not(target_os = "linux"))]
fn set_brightness(value: f64) -> Result<(), AppError> {
    info!("slider/brightness: target {}% — handler not implemented for this OS", clamp_percent(value));
    Ok(())
}

fn spawn(program: &str, args: &[&str]) -> Result<(), AppError> {
    let mut cmd = Command::new(program);
    cmd.args(args).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    cmd.spawn()
        .map(|_| ())
        .map_err(|e| AppError::Internal(format!("slider: spawn {program} failed: {e}")))
}
