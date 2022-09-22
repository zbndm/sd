#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

use std::path::PathBuf;

use sdcore::Node;
use tauri::{
	api::path,
	async_runtime::block_on,
	http::{ResponseBuilder, Uri},
	Manager, RunEvent,
};
use tracing::{debug, error};
#[cfg(target_os = "macos")]
mod macos;
mod menu;

#[tauri::command(async)]
async fn app_ready(app_handle: tauri::AppHandle) {
	let window = app_handle.get_window("main").unwrap();

	window.show().unwrap();
}

#[tokio::main]
async fn main() {
	let data_dir = path::data_dir()
		.unwrap_or_else(|| PathBuf::from("./"))
		.join("spacedrive");

	let (node, router) = Node::new(data_dir).await;

	let app = tauri::Builder::default()
		.plugin(rspc::integrations::tauri::plugin(router, {
			let node = node.clone();
			move || node.get_request_context()
		}))
		.register_uri_scheme_protocol("spacedrive", {
			let node = node.clone();
			move |_, req| {
				let url = req.uri().parse::<Uri>().unwrap();
				let mut path = url.path().split('/').collect::<Vec<_>>();
				path[0] = url.host().unwrap(); // The first forward slash causes an empty item and we replace it with the URL's host which you expect to be at the start

				let (status_code, content_type, body) = node.handle_custom_uri(path);
				ResponseBuilder::new()
					.status(status_code)
					.mimetype(content_type)
					.body(body)
			}
		})
		.setup(|app| {
			let app = app.handle();

			#[cfg(target_os = "macos")]
			{
				use macos::{lock_app_theme, AppThemeType};

				lock_app_theme(AppThemeType::Dark as _);
			}

			app.windows().iter().for_each(|(_, window)| {
				window.hide().unwrap();

				#[cfg(target_os = "windows")]
				window.set_decorations(true).unwrap();

				#[cfg(target_os = "macos")]
				{
					use macos::*;

					let window = window.ns_window().unwrap();
					set_titlebar_style(window, true, true);
					blur_window_background(window);
				}
			});

			Ok(())
		})
		.on_menu_event(menu::handle_menu_event)
		.invoke_handler(tauri::generate_handler![app_ready,])
		.menu(menu::get_menu())
		.build(tauri::generate_context!())
		.expect("error while building tauri application");

	app.run(move |app_handler, event| {
		if let RunEvent::ExitRequested { .. } = event {
			debug!("Closing all open windows...");
			app_handler
				.windows()
				.iter()
				.for_each(|(window_name, window)| {
					debug!("closing window: {window_name}");
					if let Err(e) = window.close() {
						error!("failed to close window '{}': {:#?}", window_name, e);
					}
				});

			block_on(node.shutdown());
			app_handler.exit(0);
		}
	})
}
