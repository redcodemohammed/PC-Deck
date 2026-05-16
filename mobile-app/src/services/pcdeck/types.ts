export type ActionType = "hotkey" | "launch_app" | "open_url" | "shell_command" | "macro"

export type ButtonKind = "button" | "toggle" | "slider" | "widget"

export type WidgetType = "clock" | "website" | "now_playing" | "spotify"

export interface ClockWidgetConfig {
  format?: "12h" | "24h"
  showSeconds?: boolean
  showDate?: boolean
}

export interface WebsiteWidgetConfig {
  url: string
  title?: string
}

export interface NowPlayingWidgetConfig {
  /** Optional player name filter passed to the daemon. */
  player?: string
}

export interface SpotifyWidgetConfig {
  /** Placeholder — Spotify integration needs OAuth + Web API; UI stub for now. */
  clientId?: string
}

export type WidgetConfig =
  | { type: "clock"; config: ClockWidgetConfig }
  | { type: "website"; config: WebsiteWidgetConfig }
  | { type: "now_playing"; config: NowPlayingWidgetConfig }
  | { type: "spotify"; config: SpotifyWidgetConfig }

export interface NowPlayingState {
  playing: boolean
  title?: string
  artist?: string
  album?: string
  art_url?: string
  /** Player identifier (e.g. "spotify", "firefox"). */
  player?: string
}

export interface HotkeyConfig {
  modifiers: HotkeyModifier[]
  key: string
}

export type HotkeyModifier = "ctrl" | "shift" | "alt" | "meta"

export interface LaunchAppConfig {
  appId?: string
  path: string
  name?: string
  args?: string[]
}

export interface OpenUrlConfig {
  url: string
}

export interface ShellConfig {
  command: string
}

export type MacroStep =
  | { type: "hotkey"; hotkey: HotkeyConfig }
  | { type: "delay"; ms: number }
  | { type: "text"; text: string }
  | { type: "launch_app"; app: LaunchAppConfig }
  | { type: "open_url"; url: string }

export interface MacroConfig {
  steps: MacroStep[]
}

export type ActionConfig =
  | { type: "hotkey"; hotkey: HotkeyConfig }
  | { type: "launch_app"; app: LaunchAppConfig }
  | { type: "open_url"; url: string }
  | { type: "shell_command"; command: string }
  | { type: "macro"; macro: MacroConfig }

export interface ActionDefinition {
  id: string
  type: ActionType
  name: string
  config: Record<string, unknown>
}

export interface SliderConfig {
  min: number
  max: number
  step: number
  initial: number
  bind?: "volume" | "brightness" | "custom"
}

export interface ToggleConfig {
  onAction?: ActionDefinition | null
  offAction?: ActionDefinition | null
  onLabel?: string
  offLabel?: string
  onIcon?: string
  offIcon?: string
  onColor?: string | null
  offColor?: string | null
  state?: boolean
}

export interface DeckButton {
  id: string
  /** Zero-based deck page. Defaults to 0 for older saved decks. */
  page?: number
  row: number
  column: number
  /** How many grid rows this button occupies. Defaults to 1. */
  rowSpan?: number
  /** How many grid columns this button occupies. Defaults to 1. */
  colSpan?: number
  label: string
  icon: string
  color?: string | null
  kind?: ButtonKind
  action?: ActionDefinition | null
  toggle?: ToggleConfig | null
  slider?: SliderConfig | null
  widget?: WidgetConfig | null
}

export interface Deck {
  id: string
  name: string
  rows: number
  columns: number
  buttons: DeckButton[]
  created_at: string
  updated_at: string
}

export interface PairResponse {
  token: string
  desktopName: string
}

export interface HealthResponse {
  ok: boolean
  name: string
  version: string
  platform: string
}

export interface ExecuteActionResponse {
  ok: boolean
  executedAt: string
}

export interface DaemonStatus {
  pairedDevicesKnown: boolean
  shellCommandEnabled: boolean
}

export interface WsEvent {
  type: string
  payload: Record<string, unknown>
}

export interface InstalledApp {
  id: string
  name: string
  path: string
  /** Base64-encoded PNG, no data: prefix. */
  iconPng?: string | null
}

export interface AppsResponse {
  apps: InstalledApp[]
}
