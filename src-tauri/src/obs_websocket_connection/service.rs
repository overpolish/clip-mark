use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use log::{info, warn};
use tauri::{Emitter, Manager};

use crate::{
    obs_websocket_connection::models::{
        ConnectionEvents, ConnectionStatus, RecordingEvents, RecordingStatus,
    },
    system_tray::service::{update_system_tray_icon, SystemTrayIcon},
    GlobalState, ServerConfig,
};

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
                let is_disconnected = global_state
                    .server_connection_status
                    .lock()
                    .map(|s| *s == ConnectionStatus::Disconnected)
                    .unwrap_or(false);

                if !is_disconnected {
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
        event_subscriptions: Some(obws::requests::EventSubscription::ALL),
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

    if let Ok(initial_status) = client.recording().status().await {
        update_recording_status(app_handle, initial_status.active, initial_status.paused);
    }

    let Ok(events) = client.events() else {
        return;
    };
    futures::pin_mut!(events);

    server_config_changed_rx.borrow_and_update();

    loop {
        tokio::select! {
            Some(event) = events.next() => {
                if let Err(e) = event_handler(	event, app_handle) {
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

fn event_handler(event: obws::events::Event, app_handle: &tauri::AppHandle) -> Result<(), String> {
    use obws::events::Event;
    match event {
        Event::ServerStopped => Err("OBS WebSocket server has stopped.".to_string()),
        Event::RecordStateChanged { state, path, .. } => {
            info!("Recording state changed: {:?}, path: {:?}", state, path);

            let active = matches!(state, obws::events::OutputState::Started);
            let paused = matches!(state, obws::events::OutputState::Paused);
            update_recording_status(app_handle, active, paused);

            Ok(())
        }
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

    let _ = app_handle.emit(ConnectionEvents::Status.as_ref(), status);
}

fn update_recording_status(app_handle: &tauri::AppHandle, active: bool, paused: bool) {
    let global_state = app_handle.state::<GlobalState>();

    if let Ok(mut status) = global_state.recording_status.lock() {
        status.active = active;
        status.paused = paused;
    } else {
        warn!("Failed to lock recording_status mutex");
    }

    let _ = app_handle.emit(
        RecordingEvents::Status.as_ref(),
        RecordingStatus { active, paused },
    );
}
