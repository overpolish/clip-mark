use chrono::{DateTime, Utc};

#[tauri::command]
pub async fn capture_note(
   app_handle: tauri::AppHandle,
   note: String,
   date: DateTime<Utc>,
) -> Result<(), String> {
   println!("Captured note: {} {:?}", note, date);
   todo!();
}
