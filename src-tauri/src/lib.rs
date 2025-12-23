mod app_settings;
mod constants;
mod note_capture;
mod obs_websocket_configuration;
mod obs_websocket_connection;
mod positioner;
mod shortcuts;
mod state;
mod system_tray;
mod window_utilities;

use std::sync::Mutex;

use log::info;
use tauri::{Emitter, Manager, PhysicalPosition};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_store::StoreExt;
use tauri_plugin_updater::UpdaterExt;

use crate::{
   constants::{WindowEvent, WindowLabel},
   positioner::WindowTrayExt,
   state::{
      AppSettingsState, GlobalState, RecordingStateMutex, ServerConfigState,
   },
   system_tray::service::init_system_tray,
};

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
      crate::window_utilities::commands::hide_window,
      crate::note_capture::commands::capture_note,
      crate::shortcuts::commands::get_shortcuts,
      crate::app_settings::commands::get_app_settings,
      crate::app_settings::commands::update_start_at_login,
      crate::app_settings::commands::update_hide_from_capture,
   ]);

   // State
   app_builder = app_builder
      .manage(GlobalState::default())
      .manage(RecordingStateMutex::default());

   // Plugins
   app_builder = app_builder
      .plugin(tauri_plugin_process::init())
      .plugin(tauri_plugin_opener::init())
      .plugin(tauri_plugin_store::Builder::new().build())
      .plugin(
         tauri_plugin_log::Builder::new()
            .level(tauri_plugin_log::log::LevelFilter::Info)
            .build(),
      )
      .plugin(tauri_plugin_updater::Builder::new().build());

   // Setup and build
   let app = app_builder
      .setup(|app: &mut tauri::App| {
         check_for_update(app.handle().clone());
         setup_stores(app)?;
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

fn check_for_update(app_handle: tauri::AppHandle) {
   tauri::async_runtime::spawn(async move {
      update(&app_handle).await.unwrap();
   });
}

fn setup_stores(
   app: &mut tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
   let server_config_store = app
      .store("obs-server-config.json")
      .expect("Failed to load OBS Server store");

   let app_settings_store = app
      .store("app-settings.json")
      .expect("Failed to load App Settings store");

   app.manage(Mutex::new(ServerConfigState::from_store(
      &server_config_store,
   )));
   app.manage(Mutex::new(AppSettingsState::from_store(
      &app_settings_store,
   )));

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
   let configuration_win = app
      .get_webview_window(WindowLabel::Configuration.as_ref())
      .unwrap();
   configuration_win
      .move_window_to_tray_id("tray-icon", Position::TrayCenter)?;

   close_on_focus_lost(
      app.handle().clone(),
      WindowLabel::Configuration.as_ref(),
      Some(WindowEvent::ConfigurationWillHide.as_ref().to_string()),
   );

   let recording_status_win = app
      .get_webview_window(WindowLabel::RecordingStatus.as_ref())
      .expect("Failed to get recording status window");
   recording_status_win
      .as_ref()
      .window()
      .move_window(Position::BottomLeft)?;
   recording_status_win.set_ignore_cursor_events(true)?;
   position_above_taskbar(&recording_status_win);

   let capture_note_win = app
      .get_webview_window(WindowLabel::CaptureNote.as_ref())
      .expect("Failed to get capture note window");
   capture_note_win
      .as_ref()
      .window()
      .move_window(Position::Center)?;
   close_on_focus_lost(
      app.app_handle().clone(),
      WindowLabel::CaptureNote.as_ref(),
      None,
   );

   close_on_focus_lost(
      app.app_handle().clone(),
      WindowLabel::SystemTrayMenu.as_ref(),
      None,
   );

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

async fn update(app: &tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
   if let Some(update) = app.updater()?.check().await? {
      let mut downloaded = 0;

      update
         .download_and_install(
            |chunk_length, content_length| {
               downloaded += chunk_length;
               info!("Downloaded {downloaded} from {content_length:?}");
            },
            || {
               info!("Download finished");
            },
         )
         .await?;

      println!("Update installed");
      app.restart();
   }

   Ok(())
}
