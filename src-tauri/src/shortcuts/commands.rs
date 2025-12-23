use crate::shortcuts::models::{AppShortcut, AppShortcutDetails};

#[tauri::command]
pub async fn get_shortcuts() -> Vec<AppShortcutDetails> {
   AppShortcut::all_shortcuts()
}
