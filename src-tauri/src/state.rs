use std::sync::Mutex;

use tokio::sync::watch;

use crate::obs_websocket_connection::models::{
   ConnectionStatus, RecordingStatus,
};

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
