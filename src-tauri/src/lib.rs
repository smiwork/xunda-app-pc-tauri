#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
        //初始化对话框插件，必需配置这一行，否则下载无法弹出保存文件窗口
        .plugin(tauri_plugin_dialog::init())
        //初始化 HTTP 插件
        .plugin(tauri_plugin_http::init())
        //初始化 fs 插件
        .plugin(tauri_plugin_fs::init())
        //初始化 shell 插件
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
