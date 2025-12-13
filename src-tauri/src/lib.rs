mod obs_websocket_configuration;
mod obs_websocket_connection;
mod system_tray;

use std::sync::Mutex;

use tauri::Manager;
use tauri_plugin_store::StoreExt;

use crate::system_tray::service::init_system_tray;

#[derive(Clone)]
struct ObsServerData {
    address: String,
    port: u16,
    password: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            obs_websocket_configuration::commands::get_server_details,
            obs_websocket_configuration::commands::update_server_details,
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

            let _ = app.handle().plugin(tauri_plugin_positioner::init());
            init_system_tray(&app.handle());

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

            let app_handle_for_ws = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                obs_websocket_connection::service::websocket_connection(app_handle_for_ws).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
