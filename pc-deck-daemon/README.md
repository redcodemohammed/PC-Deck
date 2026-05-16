# PC Deck Daemon
## Setup
- Rust stable
- `cargo run`

## Config paths
- `~/.pc-deck/config.json`
- `~/.pc-deck/decks.json`
- `~/.pc-deck/devices.json`

## API endpoints
`GET /health`, `POST /pair`, `GET/POST /decks`, `PUT/DELETE /decks/:deck_id`, `POST /actions/execute`, `GET /actions/types`, `GET /status`, `GET /ws`

## Platform notes
Windows-first architecture with Linux/macOS stubs under `src/platform`.
