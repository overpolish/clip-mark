use tauri_plugin_store::StoreExt;

use crate::ServerConfig;

#[derive(serde::Serialize)]
pub struct ServerConfigResponse {
    address: String,
    port: u16,
    password: String,
}

#[tauri::command]
pub async fn get_server_details(
    server_config: tauri::State<'_, std::sync::Mutex<ServerConfig>>,
) -> Result<ServerConfigResponse, String> {
    if let Ok(state) = server_config.lock() {
        Ok(ServerConfigResponse {
            address: state.address.clone(),
            port: state.port,
            password: state.password.clone(),
        })
    } else {
        Err("Failed to acquire lock on OBS server config".to_string())
    }
}

#[tauri::command]
pub async fn update_server_details(
    app: tauri::AppHandle,
    server_config: tauri::State<'_, std::sync::Mutex<ServerConfig>>,
    global_state: tauri::State<'_, crate::GlobalState>,
    address: String,
    port: u16,
    password: String,
) -> Result<(), String> {
    let store = app
        .store("obs-server-config.json")
        .expect("Failed to load Obs Server store");

    store.set("address", address.clone());
    store.set("port", port);
    store.set("password", password.clone());

    if let Ok(mut state) = server_config.lock() {
        state.address = address;
        state.port = port;
        state.password = password;

        let _ = global_state.server_config_changed_tx.send(());
    }

    Ok(())
}
