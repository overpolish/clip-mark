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
   #[strum(serialize = "clip-mark")]
   ClipMark,
   #[strum(serialize = "recording-status")]
   RecordingStatus,
   #[strum(serialize = "capture-note")]
   CaptureNote,
}
