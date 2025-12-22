use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

mod actions;
mod models;

pub fn register_shortcuts(app_handle: &AppHandle) {
   let shortcuts = vec![
      models::AppShortcut::CaptureNote,
      models::AppShortcut::OpenConfiguration,
   ];
   let shortcuts_for_closure = shortcuts.clone();

   let _ = app_handle.plugin(
      tauri_plugin_global_shortcut::Builder::new()
         .with_handler(move |app, shortcut, event| {
            if event.state() != ShortcutState::Pressed {
               return;
            }

            for app_shortcut in &shortcuts_for_closure {
               let expected = app_shortcut.default_shortcut();
               if shortcut.mods == expected.mods && shortcut.key == expected.key
               {
                  app_shortcut.execute(app);
                  break;
               }
            }
         })
         .build(),
   );

   // Register shortcuts
   for app_shortcut in shortcuts {
      let shortcut = app_shortcut.default_shortcut();
      match app_handle.global_shortcut().register(shortcut) {
         Ok(_) => println!("Registered shortcut {:?}", app_shortcut),
         Err(e) => eprintln!("Failed to register {:?}: {:?}", app_shortcut, e),
      }
   }
}
