use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use log::{info, warn};
use tauri::{Emitter, Manager};

use crate::{
   obs_websocket_connection::models::{
      ConnectionEvents, ConnectionStatus, RecordingEvents, RecordingStatus,
   },
   state::{RecordingState, RecordingStateMutex},
   system_tray::service::{update_system_tray_icon, SystemTrayIcon},
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
            obws::events::OutputState::Stopped
            | obws::events::OutputState::Stopping => (false, false),
            _ => (false, false),
         };

         update_recording_status(app_handle, active, paused, path);

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
) {
   let recording_state = app_handle.state::<RecordingStateMutex>();
   let now = chrono::Utc::now().timestamp_millis();

   if let Ok(mut state) = recording_state.lock() {
      let was_active = state.recording_status.active;
      let was_paused = state.recording_status.paused;

      handle_recording_lifecycle(
         &mut state, app_handle, active, was_active, path, now,
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
      start_recording(state, app_handle, path, now);
   } else if !active && was_active {
      stop_recording(state);
   }
}

fn start_recording(
   state: &mut RecordingState,
   app_handle: &tauri::AppHandle,
   path: Option<String>,
   now: i64,
) {
   state.recording_start = Some(now);
   state.accumulated_pause_duration = 0;
   state.pause_start = None;
   state.note_file_path = Some(resolve_note_file_path(app_handle, path, now));
}

fn stop_recording(state: &mut RecordingState) {
   state.recording_start = None;
   state.accumulated_pause_duration = 0;
   state.pause_start = None;
   state.note_file_path = None;
}

fn resolve_note_file_path(
   app_handle: &tauri::AppHandle,
   path: Option<String>,
   now: i64,
) -> String {
   if let Some(file_path) = path {
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
   }
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
