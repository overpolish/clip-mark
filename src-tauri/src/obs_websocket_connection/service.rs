use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use log::{info, warn};
use serde::Serialize;
use tauri::{Emitter, Manager};

use crate::{
    system_tray::service::{update_system_tray_icon, SystemTrayIcon},
    GlobalState, ServerConfig,
};

#[derive(Serialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ConnectionStatus {
    Connected,
    Disconnected,
    Retrying,
}

pub async fn websocket_connection(app_handle: tauri::AppHandle) {
    let global_state = app_handle.state::<GlobalState>();
    let mut server_config_changed_rx = global_state.server_config_changed_tx.subscribe();

    loop {
        let Some(server_config) = get_server_config(&app_handle) else {
            continue;
        };

        let client = match connect_to_obs(server_config).await {
            Ok(client) => client,
            Err(err) => {
                let is_connected = global_state
                    .server_connection_status
                    .lock()
                    .map(|s| *s == ConnectionStatus::Connected)
                    .unwrap_or(false);

                if is_connected {
                    warn!("Failed to connect to OBS WebSocket: {}", err);
                    connection_changed(&app_handle, ConnectionStatus::Disconnected);
                }
                continue;
            }
        };

        handle_client_connection(&app_handle, client, &mut server_config_changed_rx).await;

        tokio::select! {
            _ = tokio::time::sleep(Duration::from_secs(1)) => {},
            _ = server_config_changed_rx.changed() => {
                info!("Server config changed, retrying connection");
            }
        }
    }
}

fn get_server_config(app_handle: &tauri::AppHandle) -> Option<ServerConfig> {
    if let Ok(lock) = app_handle.state::<Mutex<ServerConfig>>().lock() {
        Some(lock.clone())
    } else {
        None
    }
}

async fn connect_to_obs(server_config: ServerConfig) -> Result<obws::Client, obws::error::Error> {
    obws::Client::connect_with_config(obws::client::ConnectConfig {
        host: server_config.address,
        port: server_config.port,
        password: Some(server_config.password),
        event_subscriptions: Some(obws::requests::EventSubscription::NONE),
        dangerous: None,
        broadcast_capacity: obws::client::DEFAULT_BROADCAST_CAPACITY,
        // Allows faster reconnection attempts
        connect_timeout: Duration::from_secs(1),
    })
    .await
}

async fn handle_client_connection(
    app_handle: &tauri::AppHandle,
    client: obws::Client,
    server_config_changed_rx: &mut tokio::sync::watch::Receiver<()>,
) {
    if let Ok(version) = client.general().version().await {
        info!("Connected to OBS Version {}", version.obs_version);
        connection_changed(app_handle, ConnectionStatus::Connected);
    }

    let Ok(events) = client.events() else {
        return;
    };
    futures::pin_mut!(events);

    server_config_changed_rx.borrow_and_update();

    loop {
        tokio::select! {
            Some(event) = events.next() => {
                if let Err(e) = event_handler(event) {
                    warn!("Event handler error: {}", e);
                    connection_changed(app_handle, ConnectionStatus::Disconnected);
                    break;
                }
            }
            _ = server_config_changed_rx.changed() => {
                warn!("Server config changed, retrying connection");
                connection_changed(app_handle, ConnectionStatus::Retrying);
                break;
            }
        }
    }
}

fn event_handler(event: obws::events::Event) -> Result<(), String> {
    use obws::events::Event;
    match event {
        Event::ServerStopped => Err("OBS WebSocket server has stopped.".to_string()),
        _ => {
            info!("Event: {event:#?}");
            Ok(())
        }
    }
}

fn connection_changed(app_handle: &tauri::AppHandle, status: ConnectionStatus) {
    info!("Connection status changed: {:?}", status);

    update_system_tray_icon(
        app_handle,
        match status {
            ConnectionStatus::Connected => SystemTrayIcon::Connected,
            _ => SystemTrayIcon::Default,
        },
    );

    {
        app_handle
            .state::<GlobalState>()
            .server_connection_status
            .lock()
            .map(|mut s| *s = status.clone())
            .expect("Failed to lock server_connection_status mutex");
    }

    let _ = app_handle.emit(crate::constants::Events::ConnectionStatus.as_ref(), status);
}
