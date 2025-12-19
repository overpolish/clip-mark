use strum::EnumString;
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

#[derive(EnumString, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AppShortcut {
   #[strum(serialize = "capture_note")]
   CaptureNote,
}

impl AppShortcut {
   pub fn default_shortcut(&self) -> Shortcut {
      match self {
         Self::CaptureNote => Shortcut::new(
            Some(Modifiers::CONTROL | Modifiers::ALT),
            Code::Equal,
         ),
      }
   }

   pub fn execute(&self, app_handle: &AppHandle) {
      match self {
         Self::CaptureNote => {
            super::actions::show_window(app_handle, "capture-note")
         }
      }
   }
}
