use tauri_plugin_store::StoreExt;

use crate::state::AppSettingsState;

#[derive(serde::Serialize)]
pub struct AppSettingsResponse {
   pub start_at_login: bool,
   pub hide_from_capture: bool,
}

#[tauri::command]
pub async fn get_app_settings(
   app_settings: tauri::State<'_, std::sync::Mutex<AppSettingsState>>,
) -> Result<AppSettingsResponse, String> {
   if let Ok(state) = app_settings.lock() {
      Ok(AppSettingsResponse {
         start_at_login: state.start_at_login,
         hide_from_capture: state.hide_from_capture,
      })
   } else {
      Err("Failed to acquire lock on App Settings".to_string())
   }
}

#[tauri::command]
pub async fn update_start_at_login(
   app_handle: tauri::AppHandle,
   app_settings: tauri::State<'_, std::sync::Mutex<AppSettingsState>>,
   start_at_login: bool,
) -> Result<(), String> {
   let store = app_handle
      .store(crate::constants::Store::AppSettings.as_ref())
      .expect("Failed to load App Settings store");

   store.set("start_at_login", start_at_login);
   super::service::update_autostart(&app_handle, start_at_login);

   if let Ok(mut state) = app_settings.lock() {
      state.start_at_login = start_at_login;
   }

   Ok(())
}

#[tauri::command]
pub async fn update_hide_from_capture(
   hide_from_capture: bool,
) -> Result<(), String> {
   todo!(
      "Implement updating hide from capture setting {:?}",
      hide_from_capture
   );
}
