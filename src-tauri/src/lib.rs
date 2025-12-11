use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click { .. } => {
                        let app = tray.app_handle();
                        let win = app.get_webview_window("clip-mark").unwrap();

                        win.show().unwrap();
                        win.set_focus().unwrap();
                    }
                    _ => {}
                })
                .build(app)?;

            if let Some(win) = app.get_webview_window("clip-mark") {
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(focused) = event {
                        if !focused {
                            win_clone.hide().unwrap();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
