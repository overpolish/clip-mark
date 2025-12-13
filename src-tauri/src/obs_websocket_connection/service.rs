use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use log::{info, warn};
use tauri::Manager;

use crate::{
    system_tray::service::{update_system_tray_icon, SystemTrayIcon},
    GlobalState, ServerConfig,
};

pub async fn websocket_connection(app_handle: tauri::AppHandle) {
    let mut interval = tokio::time::interval(Duration::from_secs(1));
    let global_state = app_handle.state::<GlobalState>();
    let mut server_config_changed_rx = global_state.server_config_changed_tx.subscribe();

    loop {
        update_system_tray_icon(&app_handle, SystemTrayIcon::Default);
        interval.tick().await;

        let Some(server_config) = get_server_config(&app_handle) else {
            continue;
        };

        let client = match connect_to_obs(server_config).await {
            Ok(client) => client,
            Err(err) => {
                warn!("Failed to connect to OBS WebSocket: {:?}", err);
                continue;
            }
        };

        handle_client_connection(&app_handle, client, &mut server_config_changed_rx).await;
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
    obws::Client::connect(
        server_config.address,
        server_config.port,
        Some(server_config.password),
    )
    .await
}

async fn handle_client_connection(
    app_handle: &tauri::AppHandle,
    client: obws::Client,
    server_config_changed_rx: &mut tokio::sync::watch::Receiver<()>,
) {
    if let Ok(version) = client.general().version().await {
        info!("Connected to OBS Version {}", version.obs_version);
    }

    update_system_tray_icon(app_handle, SystemTrayIcon::Connected);

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
                    break;
                }
            }
            _ = server_config_changed_rx.changed() => {
                warn!("Server config changed, reconnecting...");
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
