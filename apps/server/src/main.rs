use std::{env, net::SocketAddr, path::Path};

use axum::{
	extract,
	handler::Handler,
	http::{header::CONTENT_TYPE, HeaderMap, StatusCode},
	routing::get,
};
use sdcore::Node;
use tracing::info;

mod utils;

#[tokio::main]
async fn main() {
	let data_dir = match env::var("DATA_DIR") {
		Ok(path) => Path::new(&path).to_path_buf(),
		Err(_e) => {
			#[cfg(not(debug_assertions))]
			{
				panic!("'$DATA_DIR' is not set ({})", _e)
			}

			std::env::current_dir()
				.expect(
					"Unable to get your current directory. Maybe try setting $DATA_DIR?",
				)
				.join("sdserver_data")
		},
	};

	let port = env::var("PORT")
		.map(|port| port.parse::<u16>().unwrap_or(8080))
		.unwrap_or(8080);

	let (node, router) = Node::new(data_dir).await;
	let signal = utils::axum_shutdown_signal(node.clone());

	let app = axum::Router::new()
		.route("/", get(|| async { "Spacedrive Server!" }))
		.route("/health", get(|| async { "OK" }))
		.route("/spacedrive/:id", {
			let node = node.clone();
			get(|extract::Path(path): extract::Path<String>| async move {
				let (status_code, content_type, body) =
					node.handle_custom_uri(path.split('/').collect());

				(
					StatusCode::from_u16(status_code).unwrap(),
					{
						let mut headers = HeaderMap::new();
						headers.insert(CONTENT_TYPE, content_type.parse().unwrap());
						headers
					},
					body,
				)
			})
		})
		.route(
			"/rspcws",
			router.axum_ws_handler(move || node.get_request_context()),
		)
		.fallback(
			(|| async { "404 Not Found: We're past the event horizon..." })
				.into_service(),
		);

	let mut addr = "[::]:8080".parse::<SocketAddr>().unwrap(); // This listens on IPv6 and IPv4
	addr.set_port(port);
	info!("Listening on http://localhost:{}", port);
	axum::Server::bind(&addr)
		.serve(app.into_make_service())
		.with_graceful_shutdown(signal)
		.await
		.expect("Error with HTTP server!");
}
