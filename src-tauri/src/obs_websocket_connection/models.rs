use serde::Serialize;
use strum::{AsRefStr, Display, EnumString};

#[derive(EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RecordingEvents {
    #[strum(serialize = "recording:status")]
    Status,
}

#[derive(EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ConnectionEvents {
    #[strum(serialize = "connection:status")]
    Status,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ConnectionStatus {
    Connected,
    Disconnected,
    Retrying,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RecordingStatus {
    pub active: bool,
    pub paused: bool,
}
