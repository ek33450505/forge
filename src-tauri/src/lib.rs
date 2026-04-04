mod config;
mod pty;
mod session;

use session::SessionStore;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SessionStore::new())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            pty::pty_create,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
            config::config_read,
            config::config_write,
            session::session_list,
            session::session_rename,
            session::session_create_metadata,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
