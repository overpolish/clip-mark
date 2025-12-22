use strum::EnumString;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
use tauri_plugin_positioner::Position;

use crate::{constants::WindowLabel, positioner::WindowTrayExt, WindowEvent};

#[derive(EnumString, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AppShortcut {
   #[strum(serialize = "capture_note")]
   CaptureNote,
   #[strum(serialize = "open_clip_mark")]
   OpenClipMark,
}

impl AppShortcut {
   pub fn default_shortcut(&self) -> Shortcut {
      match self {
         Self::CaptureNote => Shortcut::new(
            Some(Modifiers::CONTROL | Modifiers::ALT),
            Code::Equal,
         ),
         Self::OpenClipMark => Shortcut::new(
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
         Self::OpenClipMark => {
            let win = app_handle
               .get_webview_window(WindowLabel::ClipMark.as_ref())
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
                  WindowLabel::ClipMark.as_ref(),
                  Some(WindowEvent::ConfigurationWillShow.as_ref()),
               )
            }
         }
      }
   }
}
