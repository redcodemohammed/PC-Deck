import type { Deck, DeckButton } from "@/services/pcdeck"

import { newButton } from "@/stores/deckStore"

export interface DeckPreset {
  id: string
  label: string
  description: string
  /** Width in cells (columns the preset needs). */
  width: number
  /** Height in cells (rows the preset needs). */
  height: number
  /** Builds the buttons of the preset at origin (row, column). */
  build: (row: number, column: number) => DeckButton[]
}

function actionId(): string {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function hotkeyAction(name: string, key: string): {
  id: string
  type: "hotkey"
  name: string
  config: Record<string, unknown>
} {
  return {
    id: actionId(),
    type: "hotkey",
    name,
    config: { hotkey: { modifiers: [], key } },
  }
}

export const PRESETS: DeckPreset[] = [
  {
    id: "media",
    label: "Media controls",
    description: "Prev · Play/Pause · Next · Mute · Volume",
    width: 5,
    height: 1,
    build: (row, column) => {
      const prev = {
        ...newButton(row, column),
        label: "Prev",
        icon: "⏮",
        action: hotkeyAction("Previous", "MediaPrev"),
      }
      const play = {
        ...newButton(row, column + 1),
        kind: "toggle" as const,
        label: "Play",
        icon: "▶️",
        toggle: {
          onLabel: "Pause",
          offLabel: "Play",
          onIcon: "⏸",
          offIcon: "▶️",
          onColor: null,
          offColor: null,
          onAction: hotkeyAction("Play/Pause", "MediaPlayPause"),
          offAction: hotkeyAction("Play/Pause", "MediaPlayPause"),
        },
      }
      const next = {
        ...newButton(row, column + 2),
        label: "Next",
        icon: "⏭",
        action: hotkeyAction("Next", "MediaNext"),
      }
      const mute = {
        ...newButton(row, column + 3),
        kind: "toggle" as const,
        label: "Mute",
        icon: "🔊",
        toggle: {
          onLabel: "Muted",
          offLabel: "Sound",
          onIcon: "🔇",
          offIcon: "🔊",
          onColor: null,
          offColor: null,
          onAction: hotkeyAction("Mute", "VolumeMute"),
          offAction: hotkeyAction("Mute", "VolumeMute"),
        },
      }
      const volume = {
        ...newButton(row, column + 4),
        kind: "slider" as const,
        label: "Volume",
        icon: "🔉",
        slider: { min: 0, max: 100, step: 5, initial: 50, bind: "volume" as const },
      }
      return [prev, play, next, mute, volume]
    },
  },
  {
    id: "now-playing-widget",
    label: "Now playing widget",
    description: "Live track info from the desktop",
    width: 3,
    height: 2,
    build: (row, column) => [
      {
        ...newButton(row, column),
        rowSpan: 2,
        colSpan: 3,
        kind: "widget" as const,
        label: "Now playing",
        icon: "🎵",
        widget: { type: "now_playing", config: {} },
      },
    ],
  },
  {
    id: "clock-widget",
    label: "Clock widget",
    description: "Big clock + date",
    width: 2,
    height: 1,
    build: (row, column) => [
      {
        ...newButton(row, column),
        rowSpan: 1,
        colSpan: 2,
        kind: "widget" as const,
        label: "Clock",
        icon: "🕒",
        widget: { type: "clock", config: { format: "24h", showSeconds: false, showDate: true } },
      },
    ],
  },
]

/** Find a top-left cell for the preset of size widthxheight. Picks the lowest
 *  row that has a free contiguous block; if none, places below the existing buttons.
 *  Returns null if it can't fit within the deck's rows/columns. */
export function findPresetPlacement(
  deck: Deck,
  width: number,
  height: number,
): { row: number; column: number } | null {
  if (width > deck.columns || height > deck.rows) return null
  const occupied = new Set<string>()
  for (const b of deck.buttons) {
    const rs = b.rowSpan ?? 1
    const cs = b.colSpan ?? 1
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        occupied.add(`${b.row + dr}:${b.column + dc}`)
      }
    }
  }
  for (let r = 0; r + height <= deck.rows; r++) {
    for (let c = 0; c + width <= deck.columns; c++) {
      let fits = true
      for (let dr = 0; dr < height && fits; dr++) {
        for (let dc = 0; dc < width && fits; dc++) {
          if (occupied.has(`${r + dr}:${c + dc}`)) fits = false
        }
      }
      if (fits) return { row: r, column: c }
    }
  }
  return null
}
