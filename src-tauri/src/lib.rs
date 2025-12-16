mod obs_websocket_configuration;
mod obs_websocket_connection;
mod system_tray;

use std::sync::Mutex;

use tauri::{Manager, PhysicalPosition};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_store::StoreExt;
use tokio::sync::watch;

use crate::system_tray::service::init_system_tray;

pub struct GlobalState {
    pub server_connection_status: Mutex<crate::obs_websocket_connection::models::ConnectionStatus>,
    pub server_config_changed_tx: watch::Sender<()>,
    pub recording_status: Mutex<crate::obs_websocket_connection::models::RecordingStatus>,
}

#[derive(Clone)]
struct ServerConfig {
    address: String,
    port: u16,
    password: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            obs_websocket_configuration::commands::get_server_details,
            obs_websocket_configuration::commands::update_server_details,
            obs_websocket_connection::commands::get_server_connection_status,
            obs_websocket_connection::commands::get_recording_status,
        ])
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(GlobalState {
            server_connection_status: Mutex::new(
                crate::obs_websocket_connection::models::ConnectionStatus::Disconnected,
            ),
            server_config_changed_tx: watch::channel(()).0,
            recording_status: Mutex::new(
                crate::obs_websocket_connection::models::RecordingStatus {
                    active: false,
                    paused: false,
                },
            ),
        })
        .setup(|app| {
            let store = app
                .store("obs-server-config.json")
                .expect("Failed to load OBS Server store");

            app.manage(Mutex::new(ServerConfig {
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
            init_system_tray(app.handle());

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

            let win = app.get_webview_window("recording-status").unwrap();
            let _ = win.as_ref().window().move_window(Position::BottomLeft);
            let _ = win.set_ignore_cursor_events(true);
            position_above_taskbar(&win);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Adjusts the window position to be above the taskbar
fn position_above_taskbar(win: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = win.current_monitor() {
        let taskbar_top = monitor.work_area().size.height;
        let window_size = win.outer_size().unwrap_or_default();

        // Window size excludes taskbar height, we treat bottom of work area as top of taskbar
        let y = taskbar_top.saturating_sub(window_size.height);

        let window_position = PhysicalPosition {
            x: win.outer_position().unwrap_or_default().x,
            y: y as i32,
        };

        let _ = win.as_ref().window().set_position(window_position);
    }
}
