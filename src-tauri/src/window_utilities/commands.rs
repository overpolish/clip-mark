use std::path::PathBuf;

use serde::Serialize;
use tauri::Manager;

use crate::window_utilities::service::{self, get_visible_windows};

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
   pub title: String,
   pub app_name: String,
   pub hwnd: isize,
   pub icon_path: Option<String>,
}

#[tauri::command]
pub async fn list_windows(
   app_handle: tauri::AppHandle,
) -> Result<Vec<WindowInfo>, String> {
   let icons_dir = get_icons_dir(app_handle)?;
   let mut windows = get_visible_windows(icons_dir);
   windows.sort_by(|a, b| {
      a.app_name
         .to_lowercase()
         .cmp(&b.app_name.to_lowercase())
         .then_with(|| a.title.cmp(&b.title))
   });

   Ok(windows)
}

#[tauri::command]
pub async fn center_window(hwnd: isize) {
   let _ = service::center_window(hwnd);
}

#[tauri::command]
pub async fn make_borderless(hwnd: isize) {
   let _ = service::make_borderless(hwnd);
}

#[tauri::command]
pub async fn restore_border(hwnd: isize) {
   let _ = service::restore_border(hwnd);
}

#[tauri::command]
pub async fn fullscreen_window(hwnd: isize) {
   let _ = service::fullscreen_window(hwnd);
}

#[tauri::command]
pub async fn resize_window(hwnd: isize, width: i32, height: i32) {
   let _ = service::resize_window(hwnd, width, height);
}

#[tauri::command]
pub async fn hide_window(
   app_handle: tauri::AppHandle,
   label: String,
) -> Result<(), String> {
   let win = app_handle
      .get_webview_window(&label)
      .ok_or_else(|| format!("Window with label '{}' not found", label))?;

   win.hide()
      .map_err(|e| format!("Failed to hide window: {}", e))
}

/// Create, if not exists, and return the path to the icons directory
fn get_icons_dir(app_handle: tauri::AppHandle) -> Result<PathBuf, String> {
   let cache_dir = app_handle
      .path()
      .app_cache_dir()
      .map_err(|e| format!("Failed to get cache dir: {}", e))?;

   let icons_dir = cache_dir.join("icons");
   std::fs::create_dir_all(&icons_dir)
      .map_err(|e| format!("Failed to create icons dir: {}", e))?;

   Ok(icons_dir)
}
