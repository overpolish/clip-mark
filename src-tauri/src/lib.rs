mod obs_websocket;

use std::sync::Mutex;

use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_store::StoreExt;

struct ObsServerData {
    address: String,
    port: u16,
    password: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            obs_websocket::commands::update_server_details,
        ])
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let store = app
                .store("obs-server-store.json")
                .expect("Failed to load Obs Server store");

            app.manage(Mutex::new(ObsServerData {
                address: store
                    .get("address")
                    .and_then(|v| v.as_str().map(|s| s.to_string()))
                    .unwrap_or_else(|| "localhost".to_string()),
                port: store
                    .get("port")
                    .and_then(|v| v.as_u64().map(|n| n as u16))
                    .unwrap_or(4455),
                password: store
                    .get("password")
                    .and_then(|v| v.as_str().map(|s| s.to_string()))
                    .unwrap_or_default(),
            }));

            #[cfg(desktop)]
            {
                let _ = app.handle().plugin(tauri_plugin_positioner::init());

                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .on_tray_icon_event(|tray, event| match event {
                        TrayIconEvent::Click { .. } => {
                            use tauri_plugin_positioner::{Position, WindowExt};

                            tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                            let app = tray.app_handle();

                            let win = app.get_webview_window("clip-mark").unwrap();
                            let _ = win.as_ref().window().move_window(Position::TrayCenter);

                            win.show().unwrap();
                            win.set_focus().unwrap();
                        }
                        _ => {}
                    })
                    .build(app)?;
            }

            if let Some(win) = app.get_webview_window("clip-mark") {
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(focused) = event {
                        if !focused {
                            win_clone.hide().unwrap();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
