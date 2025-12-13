use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use tauri::Manager;

use crate::{
    system_tray::service::{update_system_tray_icon, SystemTrayIcon},
    CredentialsWatcher, ObsServerData,
};

pub async fn websocket_connection(app_handle: tauri::AppHandle) {
    let mut interval = tokio::time::interval(Duration::from_secs(1));
    let credentials_tx = app_handle.state::<CredentialsWatcher>();
    let mut credentials_rx = credentials_tx.credentials_tx.subscribe();

    loop {
        update_system_tray_icon(&app_handle, SystemTrayIcon::Default);
        interval.tick().await;

        let Some(obs_server_data) = get_obs_server_data(&app_handle) else {
            continue;
        };

        let client = match connect_to_obs(obs_server_data).await {
            Ok(client) => client,
            Err(err) => {
                println!("Failed to connect to OBS WebSocket: {:?}", err);
                continue;
            }
        };

        handle_client_connection(&app_handle, client, &mut credentials_rx).await;
    }
}

fn get_obs_server_data(app_handle: &tauri::AppHandle) -> Option<ObsServerData> {
    if let Ok(lock) = app_handle.state::<Mutex<ObsServerData>>().lock() {
        Some(lock.clone())
    } else {
        None
    }
}

async fn connect_to_obs(
    obs_server_data: ObsServerData,
) -> Result<obws::Client, obws::error::Error> {
    obws::Client::connect(
        obs_server_data.address,
        obs_server_data.port,
        Some(obs_server_data.password),
    )
    .await
}

async fn handle_client_connection(
    app_handle: &tauri::AppHandle,
    client: obws::Client,
    credentials_rx: &mut tokio::sync::watch::Receiver<()>,
) {
    if let Ok(version) = client.general().version().await {
        println!("Connected to OBS Version {}", version.obs_version);
    }

    update_system_tray_icon(&app_handle, SystemTrayIcon::Connected);

    let Ok(events) = client.events() else {
        return;
    };
    futures::pin_mut!(events);

    credentials_rx.borrow_and_update();

    loop {
        tokio::select! {
                Some(event) = events.next() => {
                        println!("{event:#?}");
                }
                _ = credentials_rx.changed() => {
                        println!("Credentials changed, reconnecting...");
                        break;
                }
        }
    }
}
