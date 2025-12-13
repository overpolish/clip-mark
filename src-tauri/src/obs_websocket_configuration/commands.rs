use tauri_plugin_store::StoreExt;

use crate::ObsServerData;

#[derive(serde::Serialize)]
pub struct ObsServerDataResponse {
    address: String,
    port: u16,
    password: String,
}

#[tauri::command]
pub async fn get_server_details(
    obs_server_data: tauri::State<'_, std::sync::Mutex<ObsServerData>>,
) -> Result<ObsServerDataResponse, String> {
    if let Ok(state) = obs_server_data.lock() {
        Ok(ObsServerDataResponse {
            address: state.address.clone(),
            port: state.port,
            password: state.password.clone(),
        })
    } else {
        Err("Failed to acquire lock on OBS server data".to_string())
    }
}

#[tauri::command]
pub async fn update_server_details(
    app: tauri::AppHandle,
    obs_server_data: tauri::State<'_, std::sync::Mutex<ObsServerData>>,
    credentials_watcher: tauri::State<'_, crate::CredentialsWatcher>,
    address: String,
    port: u16,
    password: String,
) -> Result<(), String> {
    let store = app
        .store("obs-server-store.json")
        .expect("Failed to load Obs Server store");

    store.set("address", address.clone());
    store.set("port", port);
    store.set("password", password.clone());

    if let Ok(mut state) = obs_server_data.lock() {
        state.address = address;
        state.port = port;
        state.password = password;

        let _ = credentials_watcher.credentials_tx.send(());
    }

    Ok(())
}
