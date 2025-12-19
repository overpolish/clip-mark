mod obs_websocket_configuration;
mod obs_websocket_connection;
mod shortcuts;
mod system_tray;
mod window_utilities;

use std::sync::Mutex;

use strum::{AsRefStr, Display, EnumString};
use tauri::{Emitter, Manager, PhysicalPosition};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_store::StoreExt;
use tokio::sync::watch;

use crate::{
   obs_websocket_connection::models::{ConnectionStatus, RecordingStatus},
   system_tray::service::init_system_tray,
};

#[derive(
   EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash,
)]
pub enum WindowEvents {
   #[strum(serialize = "window:configuration_will_hide")]
   ConfigurationWillHide,
   #[strum(serialize = "window:configuration_will_show")]
   ConfigurationWillShow,
   #[strum(serialize = "window:capture_note_will_show")]
   CaptureNoteWillShow,
}

pub struct GlobalState {
   pub server_connection_status:
      Mutex<crate::obs_websocket_connection::models::ConnectionStatus>,
   pub server_config_changed_tx: watch::Sender<()>,
   pub recording_status:
      Mutex<crate::obs_websocket_connection::models::RecordingStatus>,
}

impl GlobalState {
   pub fn new() -> Self {
      Self {
         server_connection_status: Mutex::new(ConnectionStatus::Disconnected),
         server_config_changed_tx: watch::channel(()).0,
         recording_status: Mutex::new(RecordingStatus {
            active: false,
            paused: false,
         }),
      }
   }
}

impl Default for GlobalState {
   fn default() -> Self {
      Self::new()
   }
}

#[derive(Clone, Default)]
struct ServerConfig {
   address: String,
   port: u16,
   password: String,
}

impl ServerConfig {
   fn from_store<R: tauri::Runtime>(
      store: &tauri_plugin_store::Store<R>,
   ) -> Self {
      fn get_str<R: tauri::Runtime>(
         store: &tauri_plugin_store::Store<R>,
         key: &str,
         default: &str,
      ) -> String {
         store
            .get(key)
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_else(|| default.to_string())
      }

      Self {
         address: get_str(store, "address", "localhost"),
         port: store
            .get("port")
            .and_then(|v| v.as_u64().map(|n| n as u16))
            .unwrap_or(4455),
         password: get_str(store, "password", ""),
      }
   }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
   let context: tauri::Context<tauri::Wry> = tauri::generate_context!();

   let mut app_builder = tauri::Builder::default();

   // Register handlers
   app_builder = app_builder.invoke_handler(tauri::generate_handler![
      obs_websocket_configuration::commands::get_server_details,
      obs_websocket_configuration::commands::update_server_details,
      obs_websocket_connection::commands::get_server_connection_status,
      obs_websocket_connection::commands::get_recording_status,
      crate::window_utilities::commands::list_windows,
      crate::window_utilities::commands::center_window,
      crate::window_utilities::commands::make_borderless,
      crate::window_utilities::commands::restore_border,
      crate::window_utilities::commands::fullscreen_window,
   ]);

   // State
   app_builder = app_builder.manage(GlobalState::default());

   // Plugins
   app_builder = app_builder
      .plugin(tauri_plugin_process::init())
      .plugin(tauri_plugin_opener::init())
      .plugin(tauri_plugin_store::Builder::new().build())
      .plugin(
         tauri_plugin_log::Builder::new()
            .level(tauri_plugin_log::log::LevelFilter::Info)
            .build(),
      );

   // Setup and build
   let app = app_builder
      .setup(|app: &mut tauri::App| {
         setup_server_config(app)?;
         setup_positioner_and_tray(app)?;
         setup_windows(app)?;
         spawn_websocket_connection(app.handle());
         shortcuts::register_shortcuts(app.handle());

         Ok(())
      })
      .build(context)
      .unwrap();

   // Run
   app.run(|_app_handle, _event| {})
}

fn setup_server_config(
   app: &mut tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
   let store = app
      .store("obs-server-config.json")
      .expect("Failed to load OBS Server store");
   app.manage(Mutex::new(ServerConfig::from_store(&store)));

   Ok(())
}

/// Initialize positioner plugin and system tray
fn setup_positioner_and_tray(
   app: &mut tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
   app.handle().plugin(tauri_plugin_positioner::init())?;
   init_system_tray(app.handle());

   Ok(())
}

/// Set up all application windows with their configurations
fn setup_windows(
   app: &mut tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
   close_on_focus_lost(
      app.handle().clone(),
      "clip-mark",
      Some(WindowEvents::ConfigurationWillHide.as_ref().to_string()),
   );

   let recording_status_win = app
      .get_webview_window("recording-status")
      .expect("Failed to get recording status window");
   recording_status_win
      .as_ref()
      .window()
      .move_window(Position::BottomLeft)?;
   recording_status_win.set_ignore_cursor_events(true)?;
   recording_status_win.show()?;
   position_above_taskbar(&recording_status_win);

   let capture_note_win = app
      .get_webview_window("capture-note")
      .expect("Failed to get capture note window");
   capture_note_win
      .as_ref()
      .window()
      .move_window(Position::Center)?;
   close_on_focus_lost(app.app_handle().clone(), "capture-note", None);

   Ok(())
}

/// Spawn OBS Websocket connection
fn spawn_websocket_connection(app_handle: &tauri::AppHandle) {
   let app_handle_for_thread = app_handle.clone();
   tauri::async_runtime::spawn(async move {
      obs_websocket_connection::service::websocket_connection(
         app_handle_for_thread,
      )
      .await;
   });
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

fn close_on_focus_lost(
   app_handle: tauri::AppHandle,
   window_name: &str,
   emit_event: Option<String>,
) {
   if let Some(win) = app_handle.get_webview_window(window_name) {
      let win_clone = win.clone();
      let event_name = emit_event.clone();

      win.on_window_event(move |event| {
         if let tauri::WindowEvent::Focused(focused) = event {
            if !focused {
               if let Some(event_name) = &event_name {
                  let _ = app_handle.emit(event_name.as_str(), ());
               }

               let _ = win_clone.hide();
            }
         }
      });
   }
}
