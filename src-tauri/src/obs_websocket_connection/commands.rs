use tauri::Manager;

use crate::{
   obs_websocket_connection::models::ConnectionStatus,
   state::RecordingStateMutex, GlobalState,
};

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
   let recording_state = app_handle.state::<RecordingStateMutex>();
   let lock = recording_state
      .lock()
      .map_err(|e| format!("Failed to acquire lock: {}", e))?;
   Ok(lock.recording_status.clone())
}
