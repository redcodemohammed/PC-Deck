# PC Deck
PC Deck is a local-network virtual Stream Deck system with an Expo tablet app and Rust desktop daemon.

## Architecture
- `pc-deck-app`: tablet UI (Expo + React Native)
- `pc-deck-daemon`: LAN daemon (Axum + Tokio)

## Run
### Daemon
`cd pc-deck-daemon && cargo run`
### App
`cd pc-deck-app && npm install && npm run start`

## Pairing flow
1. Start daemon and read pairing code from logs.
2. Enter desktop IP + pairing code in tablet app.
3. App stores returned token and uses it for authenticated requests.

## Supported actions (MVP scaffold)
- hotkey
- launch_app
- open_url
- shell_command (guarded by config, TODO)
- macro (TODO)

## Security notes
- Pairing required for authenticated actions.
- Token-based auth via `x-pcdeck-token` header.
- Intended for trusted LAN only.

## Roadmap
- Real action handlers per platform
- richer deck editing UX
- drag/drop and plugin support (post-MVP)

## CI/CD
- GitHub Actions workflow: `.github/workflows/build-release.yml`
- Builds Android release APK from `pc-deck-app` and uploads it as an artifact.
- Builds Windows release EXE from `pc-deck-daemon` and uploads it as an artifact.
- Triggered on PRs, pushes, and manual dispatch.
