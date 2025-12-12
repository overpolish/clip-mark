use tauri_plugin_store::StoreExt;

use crate::ObsServerData;

#[tauri::command]
pub async fn update_server_details(
    app: tauri::AppHandle,
    obs_server_data: tauri::State<'_, std::sync::Mutex<ObsServerData>>,
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
    }

    Ok(())
}
