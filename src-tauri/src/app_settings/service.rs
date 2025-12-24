use tauri_plugin_autostart::ManagerExt;

pub fn update_autostart(app_handle: &tauri::AppHandle, enable: bool) {
   let autostart_manager = app_handle.autolaunch();
   if enable {
      let _ = autostart_manager.enable();
   } else {
      let _ = autostart_manager.disable();
   }
}
