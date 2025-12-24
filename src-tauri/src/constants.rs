use strum::{AsRefStr, Display, EnumString};

#[derive(
   EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash,
)]
pub enum WindowEvent {
   #[strum(serialize = "window:configuration_will_hide")]
   ConfigurationWillHide,
   #[strum(serialize = "window:configuration_will_show")]
   ConfigurationWillShow,
   #[strum(serialize = "window:capture_note_will_show")]
   CaptureNoteWillShow,
}

#[derive(
   EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash,
)]
pub enum WindowLabel {
   #[strum(serialize = "configuration")]
   Configuration,
   #[strum(serialize = "recording-status")]
   RecordingStatus,
   #[strum(serialize = "capture-note")]
   CaptureNote,
   #[strum(serialize = "system-tray-menu")]
   SystemTrayMenu,
}

impl WindowLabel {
   pub fn capturable_windows() -> Vec<WindowLabel> {
      vec![
         WindowLabel::Configuration,
         WindowLabel::RecordingStatus,
         WindowLabel::CaptureNote,
      ]
   }
}

#[derive(
   EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash,
)]
pub enum Store {
   #[strum(serialize = "app-settings.json")]
   AppSettings,
   #[strum(serialize = "obs-server-config.json")]
   ObsServerConfig,
}
