mod actions;
mod auth;
mod config;
mod error;
mod models;
mod platform;
mod routes;
mod storage;

use std::{net::SocketAddr, sync::Arc};

use axum::{routing::{delete, get, post, put}, Router};
use tokio::sync::{broadcast, RwLock};
use tower_http::cors::CorsLayer;
use tracing::info;

use crate::{
    config::DaemonConfig,
    models::WsEvent,
    routes::{actions::{execute_action, set_slider}, apps::list_apps, decks::{create_deck, delete_deck, get_decks, update_deck}, health::health, pair::pair, status::status, widgets::{now_playing, now_playing_control}, ws::ws_handler},
    storage::file_store::FileStore,
};

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<RwLock<DaemonConfig>>,
    pub store: Arc<FileStore>,
    pub ws_tx: broadcast::Sender<WsEvent>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter("info").init();

    let cfg = DaemonConfig::load_or_default().expect("config load failed");
    info!("Pairing code: {}", cfg.pairing_code);
    let store = FileStore::new().expect("store init failed");
    let (ws_tx, _) = broadcast::channel(256);

    let app_state = AppState { config: Arc::new(RwLock::new(cfg)), store: Arc::new(store), ws_tx };

    let app = Router::new()
        .route("/health", get(health))
        .route("/pair", post(pair))
        .route("/decks", get(get_decks).post(create_deck))
        .route("/decks/:deck_id", put(update_deck).delete(delete_deck))
        .route("/actions/types", get(actions::types))
        .route("/actions/execute", post(execute_action))
        .route("/actions/slider", post(set_slider))
        .route("/apps", get(list_apps))
        .route("/widgets/now_playing", get(now_playing))
        .route("/widgets/now_playing/control", post(now_playing_control))
        .route("/status", get(status))
        .route("/ws", get(ws_handler))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 41730));
    info!("PC Deck daemon listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
