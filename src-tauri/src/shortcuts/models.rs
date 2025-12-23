use strum::EnumString;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
use tauri_plugin_positioner::Position;

use crate::{constants::WindowLabel, positioner::WindowTrayExt, WindowEvent};

#[derive(EnumString, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AppShortcut {
   #[strum(serialize = "capture_note")]
   CaptureNote,
   #[strum(serialize = "open_configuration")]
   OpenConfiguration,
}

#[derive(serde::Serialize)]
pub struct AppShortcutDetails {
   pub title: String,
   pub description: Option<String>,
   pub shortcut: Vec<String>,
}

impl AppShortcut {
   fn title(&self) -> &str {
      match self {
         Self::CaptureNote => "Capture Note",
         Self::OpenConfiguration => "Open Configuration",
      }
   }

   fn description(&self) -> Option<&str> {
      match self {
         AppShortcut::CaptureNote => Some("When recording in progress."),
         AppShortcut::OpenConfiguration => None,
      }
   }

   pub fn default_shortcut(&self) -> Shortcut {
      match self {
         Self::CaptureNote => Shortcut::new(
            Some(Modifiers::CONTROL | Modifiers::ALT),
            Code::Equal,
         ),
         Self::OpenConfiguration => Shortcut::new(
            Some(Modifiers::CONTROL | Modifiers::ALT),
            Code::Minus,
         ),
      }
   }

   pub fn execute(&self, app_handle: &AppHandle) {
      match self {
         Self::CaptureNote => {
            let recording_state =
               app_handle.state::<crate::state::RecordingStateMutex>();
            let is_recording = if let Ok(state) = recording_state.lock() {
               state.recording_status.active
            } else {
               false
            };

            if !is_recording {
               return;
            }

            super::actions::show_window(
               app_handle,
               WindowLabel::CaptureNote.as_ref(),
               Some(WindowEvent::CaptureNoteWillShow.as_ref()),
            )
         }
         Self::OpenConfiguration => {
            let win = app_handle
               .get_webview_window(WindowLabel::Configuration.as_ref())
               .unwrap();

            if win.is_visible().unwrap_or(false) {
               let _ = app_handle
                  .emit(WindowEvent::ConfigurationWillHide.as_ref(), ());
               let _ = win.hide();
            } else {
               let _ =
                  win.move_window_to_tray_id("tray-icon", Position::TrayCenter);

               super::actions::show_window(
                  app_handle,
                  WindowLabel::Configuration.as_ref(),
                  Some(WindowEvent::ConfigurationWillShow.as_ref()),
               )
            }
         }
      }
   }

   pub fn all_shortcuts() -> Vec<AppShortcutDetails> {
      vec![
         AppShortcut::CaptureNote.to_details(),
         AppShortcut::OpenConfiguration.to_details(),
      ]
   }

   fn shortcut_to_string(shortcut: Shortcut) -> Vec<String> {
      let mut parts = Vec::new();

      let mods = shortcut.mods;
      if mods.ctrl() {
         parts.push("Ctrl");
      }
      if mods.alt() {
         parts.push("Alt");
      }
      if mods.shift() {
         parts.push("Shift");
      }
      if mods.meta() {
         parts.push("Meta");
      }

      let key_str = match shortcut.key {
         Code::Equal => "=",
         Code::Minus => "-",
         _ => &format!("{:?}", shortcut.key),
      };

      parts.push(key_str);

      parts.into_iter().map(|s| s.to_string()).collect()
   }

   fn to_details(self) -> AppShortcutDetails {
      AppShortcutDetails {
         title: self.title().to_string(),
         description: self.description().map(|s| s.to_string()),
         shortcut: Self::shortcut_to_string(self.default_shortcut()),
      }
   }
}
