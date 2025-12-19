use tauri::{AppHandle, Manager};

pub fn show_window(app_handle: &AppHandle, window_label: &str) {
   if let Some(win) = app_handle.get_webview_window(window_label) {
      let _ = win.show();
      let _ = win.set_focus();
   }
}
