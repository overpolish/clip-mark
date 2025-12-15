use tauri::{tray::TrayIconEvent, LogicalSize, Manager};

pub fn init_system_tray(app_handle: &tauri::AppHandle) {
    let tray = app_handle.tray_by_id("tray-icon").unwrap();
    tray.on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click { .. } = event {
            use tauri_plugin_positioner::{Position, WindowExt};

            tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
            let app = tray.app_handle();

            let win = app.get_webview_window("clip-mark").unwrap();
            let _ = win.as_ref().window().move_window(Position::TrayCenter);
            // Height precise for UI
            let _ = win.set_size(LogicalSize::new(450.0, 227.0));

            win.show().unwrap();
            win.set_focus().unwrap();
        }
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SystemTrayIcon {
    Default,
    Connected,
}

pub fn update_system_tray_icon(app_handle: &tauri::AppHandle, icon: SystemTrayIcon) {
    let tray = app_handle.tray_by_id("tray-icon").unwrap();

    let icon_bytes: &[u8] = match icon {
        SystemTrayIcon::Default => include_bytes!("../../icons/icon.ico"),
        SystemTrayIcon::Connected => include_bytes!("../../icons/icon-connected.ico"),
    };

    if let Ok(image) = tauri::image::Image::from_bytes(icon_bytes) {
        let _ = tray.set_icon(Some(image));
    }
}
