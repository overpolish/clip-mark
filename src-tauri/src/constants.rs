use strum::{AsRefStr, Display, EnumString};

#[derive(EnumString, AsRefStr, Display, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Events {
    #[strum(serialize = "connection_status")]
    ConnectionStatus,
}
