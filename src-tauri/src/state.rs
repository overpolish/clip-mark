use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tokio::sync::watch;

use crate::obs_websocket_connection::models::{
   ConnectionStatus, RecordingStatus,
};

pub struct GlobalState {
   pub server_connection_status:
      Mutex<crate::obs_websocket_connection::models::ConnectionStatus>,
   pub server_config_changed_tx: watch::Sender<()>,
}

impl GlobalState {
   pub fn new() -> Self {
      Self {
         server_connection_status: Mutex::new(ConnectionStatus::Disconnected),
         server_config_changed_tx: watch::channel(()).0,
      }
   }
}

impl Default for GlobalState {
   fn default() -> Self {
      Self::new()
   }
}

#[derive(Clone, Default)]
pub struct ServerConfigState {
   pub address: String,
   pub port: u16,
   pub password: String,
}

impl ServerConfigState {
   pub fn from_store<R: tauri::Runtime>(
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

#[derive(Clone, Default)]
pub struct AppSettingsState {
   pub start_at_login: bool,
   pub hide_from_capture: bool,
}

impl AppSettingsState {
   pub fn from_store<R: tauri::Runtime>(
      store: &tauri_plugin_store::Store<R>,
   ) -> Self {
      Self {
         start_at_login: store
            .get("start_at_login")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),

         hide_from_capture: store
            .get("hide_from_capture")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
      }
   }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RecordingState {
   pub recording_status: RecordingStatus,
   pub note_file_path: Option<String>,
   pub recording_start: Option<i64>,
   pub accumulated_pause_duration: i64,
   pub pause_start: Option<i64>,
}

pub type RecordingStateMutex = Mutex<RecordingState>;
