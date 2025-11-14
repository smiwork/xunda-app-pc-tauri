/*
 * @Author: “chenbaolong”
 * @Date: 2025-08-31 21:39:01
 * @LastEditors: “chenbaolong”
 * @LastEditTime: 2025-11-14 11:12:37
 * @Description:
 *
 */
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .plugin(tauri_plugin_os::init())
        // .plugin(tauri_plugin_sql::Builder::default().build())
        //初始化对话框插件，必需配置这一行，否则下载无法弹出保存文件窗口
        .plugin(tauri_plugin_dialog::init())
        //初始化 fs 插件
        .plugin(tauri_plugin_fs::init())
        //初始化 HTTP 插件
        .plugin(tauri_plugin_http::init())
        //初始化 updater 插件
        .plugin(tauri_plugin_updater::Builder::new().build())
        //初始化 notification 插件
        .plugin(tauri_plugin_notification::init())
        //初始化 process 插件
        .plugin(tauri_plugin_process::init())
        //初始化 shell 插件
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            //updater 插件实例化
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            //初始化发送系统通知
            use tauri_plugin_notification::NotificationExt;
            app.notification()
                .builder()
                .icon("icons/icon.png")
                .large_icon("icons/icon.png")
                .title("快销客")
                .body("快销客已开始在后台运行，可以在系统托盘上找到。")
                .show()
                .unwrap();

            // 初始化系统系统托盘及菜单
            let dashboard_i = MenuItem::with_id(app, "dashboard", "回到面板", true, None::<&str>)?;
            let relaunch_i = MenuItem::with_id(app, "relaunch", "重启应用", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&dashboard_i, &relaunch_i, &quit_i])?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        println!("left click pressed and released");
                        // in this example, let's show and focus the main window when the tray is clicked
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.set_skip_taskbar(false);
                            let _ = window.set_focus();
                        }
                    }
                    _ => {
                        // println!("unhandled event {event:?}");
                    }
                })
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "relaunch" => {
                        app.restart();
                    }
                    "dashboard" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.set_skip_taskbar(false);
                            let _ = window.set_focus();
                        }
                    }
                    _ => {
                        // println!("menu item {:?} not handled", event.id);
                    }
                })
                .build(app)?;
            Ok(())
        })
        // .plugin(tauri_plugin_process::init())
        //初始化对话框插件，必需配置这一行，否则下载无法弹出保存文件窗口
        // .plugin(tauri_plugin_dialog::init())
        //初始化 HTTP 插件
        // .plugin(tauri_plugin_http::init())
        //初始化 fs 插件
        // .plugin(tauri_plugin_fs::init())
        //初始化 shell 插件
        // .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
