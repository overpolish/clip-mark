use tauri::{LogicalPosition, Manager};
use tauri_plugin_autostart::ManagerExt;

use crate::{constants::WindowLabel, window_utilities::WindowUtilitiesExt};

pub fn update_autostart(app_handle: &tauri::AppHandle, enable: bool) {
   let autostart_manager = app_handle.autolaunch();
   if enable {
      let _ = autostart_manager.enable();
   } else {
      let _ = autostart_manager.disable();
   }
}

pub fn update_hide_from_capture(app_handle: &tauri::AppHandle, hide: bool) {
   let windows = WindowLabel::capturable_windows();
   for window_label in windows {
      if let Some(window) = app_handle.get_webview_window(window_label.as_ref())
      {
         let _ = window.set_content_protected(hide);
         let was_visible = window.is_visible().unwrap_or(false);

         if !was_visible {
            // Updating content_protected causes white flash on open
            //
            // On initial render the configuration window (as it is not transparent)
            // has a white background visible until the real window opened
            let _ = window.set_position(LogicalPosition { x: -9999, y: -9999 });
            window.show_without_focus();
            let _ = window.hide();
         }
      }
   }
}
