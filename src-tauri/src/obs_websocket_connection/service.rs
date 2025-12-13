use std::{sync::Mutex, time::Duration};

use futures::StreamExt;
use tauri::Manager;

use crate::{
    system_tray::service::{update_system_tray_icon, SystemTrayIcon},
    ObsServerData,
};

pub async fn websocket_connection(app_handle: tauri::AppHandle) {
    let mut interval = tokio::time::interval(Duration::from_secs(1));

    loop {
        update_system_tray_icon(&app_handle, SystemTrayIcon::Default);
        interval.tick().await;

        if let Some(obs_server_data) = get_obs_server_data(&app_handle) {
            let client_connection = obws::Client::connect(
                obs_server_data.address,
                obs_server_data.port,
                Some(obs_server_data.password),
            )
            .await;

            if let Ok(client) = client_connection {
                let version = client.general().version().await;
                if let Ok(version) = version {
                    println!("Connected to OBS Version {}", version.obs_version);
                }

                update_system_tray_icon(&app_handle, SystemTrayIcon::Connected);

                if let Ok(events) = client.events() {
                    futures::pin_mut!(events);

                    while let Some(event) = events.next().await {
                        println!("{event:#?}");
                    }
                }
            } else {
                println!(
                    "Failed to connect to OBS WebSocket {:?}",
                    client_connection.err()
                );
            }
        }
    }
}

fn get_obs_server_data(app_handle: &tauri::AppHandle) -> Option<ObsServerData> {
    if let Ok(lock) = app_handle.state::<Mutex<ObsServerData>>().lock() {
        Some(lock.clone())
    } else {
        None
    }
}
