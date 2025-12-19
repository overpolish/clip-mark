use tauri::{AppHandle, Emitter, Manager};

pub fn show_window(
   app_handle: &AppHandle,
   window_label: &str,
   event: Option<&str>,
) {
   if let Some(win) = app_handle.get_webview_window(window_label) {
      if let Some(event) = event {
         let _ = app_handle.emit(event, ());
      }

      let _ = win.show();
      let _ = win.set_focus();
   }
}
