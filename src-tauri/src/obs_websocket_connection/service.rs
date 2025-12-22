use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use log::{info, warn};
use tauri::{Emitter, Manager};

use crate::{
   constants::WindowLabel,
   obs_websocket_connection::models::{
      ConnectionEvents, ConnectionStatus, RecordingEvents, RecordingStatus,
   },
   state::{RecordingState, RecordingStateMutex},
   system_tray::service::{update_system_tray_icon, SystemTrayIcon},
   window_utilities::commands::hide_window,
   GlobalState, ServerConfigState,
};

pub async fn websocket_connection(app_handle: tauri::AppHandle) {
   let global_state = app_handle.state::<GlobalState>();
   let mut server_config_changed_rx =
      global_state.server_config_changed_tx.subscribe();

   loop {
      let Some(server_config) = get_server_config(&app_handle) else {
         continue;
      };

      let client = match connect_to_obs(server_config).await {
         Ok(client) => client,
         Err(err) => {
            let is_disconnected = global_state
               .server_connection_status
               .lock()
               .map(|s| *s == ConnectionStatus::Disconnected)
               .unwrap_or(false);

            if !is_disconnected {
               warn!("Failed to connect to OBS WebSocket: {}", err);
               connection_changed(&app_handle, ConnectionStatus::Disconnected);
            }
            continue;
         }
      };

      handle_client_connection(
         &app_handle,
         client,
         &mut server_config_changed_rx,
      )
      .await;

      tokio::select! {
          _ = tokio::time::sleep(Duration::from_secs(1)) => {},
          _ = server_config_changed_rx.changed() => {
              info!("Server config changed, retrying connection");
          }
      }
   }
}

fn get_server_config(
   app_handle: &tauri::AppHandle,
) -> Option<ServerConfigState> {
   if let Ok(lock) = app_handle.state::<Mutex<ServerConfigState>>().lock() {
      Some(lock.clone())
   } else {
      None
   }
}

async fn connect_to_obs(
   server_config: ServerConfigState,
) -> Result<obws::Client, obws::error::Error> {
   obws::Client::connect_with_config(obws::client::ConnectConfig {
      host: server_config.address,
      port: server_config.port,
      password: Some(server_config.password),
      event_subscriptions: Some(obws::requests::EventSubscription::ALL),
      dangerous: None,
      broadcast_capacity: obws::client::DEFAULT_BROADCAST_CAPACITY,
      // Allows faster reconnection attempts
      connect_timeout: Duration::from_secs(1),
   })
   .await
}

async fn handle_client_connection(
   app_handle: &tauri::AppHandle,
   client: obws::Client,
   server_config_changed_rx: &mut tokio::sync::watch::Receiver<()>,
) {
   if let Ok(version) = client.general().version().await {
      info!("Connected to OBS Version {}", version.obs_version);
      connection_changed(app_handle, ConnectionStatus::Connected);
   }

   if let Ok(initial_status) = client.recording().status().await {
      update_recording_status(
         app_handle,
         initial_status.active,
         initial_status.paused,
         None,
         Some(initial_status.duration.whole_milliseconds() as i64),
      );
   }

   let Ok(events) = client.events() else {
      return;
   };
   futures::pin_mut!(events);

   server_config_changed_rx.borrow_and_update();

   loop {
      tokio::select! {
          Some(event) = events.next() => {
              if let Err(e) = event_handler(	event, app_handle) {
                  warn!("Event handler error: {}", e);
                  connection_changed(app_handle, ConnectionStatus::Disconnected);
                  break;
              }
          }
          _ = server_config_changed_rx.changed() => {
              warn!("Server config changed, retrying connection");
              connection_changed(app_handle, ConnectionStatus::Retrying);
              break;
          }
      }
   }
}

fn event_handler(
   event: obws::events::Event,
   app_handle: &tauri::AppHandle,
) -> Result<(), String> {
   use obws::events::Event;
   match event {
      Event::ServerStopped => {
         Err("OBS WebSocket server has stopped.".to_string())
      }
      Event::RecordStateChanged { state, path, .. } => {
         info!("Recording state changed: {:?}, path: {:?}", state, path);

         let (active, paused) = match state {
            obws::events::OutputState::Started => (true, false),
            obws::events::OutputState::Paused => (true, true),
            obws::events::OutputState::Resumed => (true, false),
            obws::events::OutputState::Stopping => (true, false), // Still active until fully stopped
            obws::events::OutputState::Stopped => (false, false),
            _ => (false, false),
         };

         update_recording_status(app_handle, active, paused, path, None);

         // Special handling for Stopping state to emit inactive correctly
         // hides recording status immediately feeling responsive
         if state == obws::events::OutputState::Stopping {
            emit_recording_status_change(app_handle, false, false);
         }

         Ok(())
      }
      _ => {
         info!("Event: {event:#?}");
         Ok(())
      }
   }
}

fn connection_changed(app_handle: &tauri::AppHandle, status: ConnectionStatus) {
   info!("Connection status changed: {:?}", status);

   emit_recording_status_change(app_handle, false, false);

   update_system_tray_icon(
      app_handle,
      match status {
         ConnectionStatus::Connected => SystemTrayIcon::Connected,
         _ => SystemTrayIcon::Default,
      },
   );

   {
      app_handle
         .state::<GlobalState>()
         .server_connection_status
         .lock()
         .map(|mut s| *s = status.clone())
         .expect("Failed to lock server_connection_status mutex");
   }

   let _ = app_handle.emit(ConnectionEvents::Status.as_ref(), status);
}

fn update_recording_status(
   app_handle: &tauri::AppHandle,
   active: bool,
   paused: bool,
   path: Option<String>,
   existing_duration_ms: Option<i64>,
) {
   let recording_state = app_handle.state::<RecordingStateMutex>();
   let now = chrono::Utc::now().timestamp_millis();

   if let Ok(mut state) = recording_state.lock() {
      let was_active = state.recording_status.active;
      let was_paused = state.recording_status.paused;

      handle_recording_lifecycle(
         &mut state,
         app_handle,
         active,
         was_active,
         path,
         if let Some(duration) = existing_duration_ms {
            // Negative 1.1 second as the duration is not accurate from OBS
            // this gets notes closer to actual timecode
            now - duration - 1100
         } else {
            now
         },
      );
      handle_pause_state(&mut state, active, paused, was_paused, now);

      state.recording_status.active = active;
      state.recording_status.paused = paused;
   } else {
      warn!("Failed to lock recording_status mutex");
   }

   emit_recording_status_change(app_handle, active, paused);
}

fn handle_recording_lifecycle(
   state: &mut RecordingState,
   app_handle: &tauri::AppHandle,
   active: bool,
   was_active: bool,
   path: Option<String>,
   now: i64,
) {
   if active && !was_active {
      match start_recording(state, app_handle, path, now) {
         Ok(_) => {}
         Err(err) => {
            warn!("Failed to initialize recording: {}", err);
         }
      }
   } else if !active && was_active {
      let app_handle_clone = app_handle.clone();
      tauri::async_runtime::spawn(async move {
         let _ =
            hide_window(app_handle_clone, WindowLabel::CaptureNote.to_string())
               .await;
      });

      match stop_recording(state, app_handle, path) {
         Ok(_) => {}
         Err(err) => {
            warn!("Failed to finalize notes: {}", err);
         }
      }
   }
}

fn start_recording(
   state: &mut RecordingState,
   app_handle: &tauri::AppHandle,
   path: Option<String>,
   now: i64,
) -> Result<(), std::io::Error> {
   state.recording_start = Some(now);
   state.accumulated_pause_duration = 0;
   state.pause_start = None;
   state.note_file_path = Some(resolve_note_file_path(app_handle, path, now)?);

   let recording_status_win = app_handle
      .get_webview_window(WindowLabel::RecordingStatus.as_ref())
      .expect("Failed to get recording status window");
   let _ = recording_status_win.show();

   Ok(())
}

fn stop_recording(
   state: &mut RecordingState,
   app_handle: &tauri::AppHandle,
   output_file_path: Option<String>,
) -> Result<(), std::io::Error> {
   state.recording_start = None;
   state.accumulated_pause_duration = 0;
   state.pause_start = None;

   if let Some(note_path) = state.note_file_path.take() {
      if let Some(output_path) = output_file_path {
         let final_note_path = std::path::Path::new(&output_path)
            .with_extension("txt")
            .to_string_lossy()
            .to_string();

         if note_path != final_note_path {
            if let Some(parent) =
               std::path::Path::new(&final_note_path).parent()
            {
               std::fs::create_dir_all(parent)?;
            }

            std::fs::rename(&note_path, &final_note_path)?;
         }
      }
   }

   let recording_status_win = app_handle
      .get_webview_window(WindowLabel::RecordingStatus.as_ref())
      .expect("Failed to get recording status window");
   let _ = recording_status_win.hide();

   Ok(())
}

fn resolve_note_file_path(
   app_handle: &tauri::AppHandle,
   path: Option<String>,
   now: i64,
) -> Result<String, std::io::Error> {
   let file_path = if let Some(file_path) = path {
      std::path::Path::new(&file_path)
         .with_extension("txt")
         .to_string_lossy()
         .to_string()
   } else if let Ok(cache_dir) = app_handle.path().cache_dir() {
      cache_dir
         .join(format!("temp_recording_{}.txt", now))
         .to_string_lossy()
         .to_string()
   } else {
      warn!("Failed to get cache directory for note file path");
      format!("temp_recording_{}.txt", now)
   };

   if let Some(parent) = std::path::Path::new(&file_path).parent() {
      std::fs::create_dir_all(parent)?;
   }

   std::fs::File::create(&file_path)?;

   Ok(file_path)
}

fn handle_pause_state(
   state: &mut RecordingState,
   active: bool,
   paused: bool,
   was_paused: bool,
   now: i64,
) {
   if !active {
      return;
   }

   if paused && !was_paused {
      pause_recording(state, now);
   } else if !paused && was_paused {
      resume_recording(state, now);
   }
}

fn pause_recording(state: &mut RecordingState, now: i64) {
   state.pause_start = Some(now);
}

fn resume_recording(state: &mut RecordingState, now: i64) {
   if let Some(pause_start) = state.pause_start {
      let pause_duration = now - pause_start;
      state.accumulated_pause_duration += pause_duration;
   }

   state.pause_start = None;
}

fn emit_recording_status_change(
   app_handle: &tauri::AppHandle,
   active: bool,
   paused: bool,
) {
   let _ = app_handle.emit(
      RecordingEvents::Status.as_ref(),
      RecordingStatus { active, paused },
   );
}
