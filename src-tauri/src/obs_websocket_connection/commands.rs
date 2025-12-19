use tauri::Manager;

use crate::{obs_websocket_connection::models::ConnectionStatus, GlobalState};

#[tauri::command]
pub async fn get_server_connection_status(
   app_handle: tauri::AppHandle,
) -> Result<ConnectionStatus, String> {
   let global_state = app_handle.state::<GlobalState>();
   let lock = global_state
      .server_connection_status
      .lock()
      .map_err(|e| format!("Failed to acquire lock: {}", e))?;
   Ok(lock.clone())
}

#[tauri::command]
pub async fn get_recording_status(
   app_handle: tauri::AppHandle,
) -> Result<crate::obs_websocket_connection::models::RecordingStatus, String> {
   let global_state = app_handle.state::<GlobalState>();
   let lock = global_state
      .recording_status
      .lock()
      .map_err(|e| format!("Failed to acquire lock: {}", e))?;
   Ok(lock.clone())
}
