use tauri::Manager;

use crate::{obs_websocket_connection::service::ConnectionStatus, GlobalState};

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
