use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_positioner::WindowExt;

pub fn show_window(
   app_handle: &AppHandle,
   window_label: &str,
   event: Option<&str>,
   position: Option<tauri_plugin_positioner::Position>,
) {
   if let Some(win) = app_handle.get_webview_window(window_label) {
      if let Some(event) = event {
         let _ = app_handle.emit(event, ());
      }

      if let Some(position) = position {
         let _ = win.move_window(position);
      }

      let _ = win.show();
      let _ = win.set_focus();
   }
}
