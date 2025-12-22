use strum::EnumString;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

use crate::{constants::WindowLabel, WindowEvent};

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
      }
   }
}
