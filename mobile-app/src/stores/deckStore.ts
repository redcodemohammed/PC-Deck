import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Deck, DeckButton } from "@/services/pcdeck"

import { getApi, useConnectionStore } from "./connectionStore"
import { createMmkvStorage } from "./createMmkvStorage"

export type DeckLoadStatus = "idle" | "loading" | "ready" | "error"

interface DeckState {
  /** Per-device deck cache. */
  decksByDevice: Record<string, Deck[]>
  /** Per-device currently selected deck id. */
  currentByDevice: Record<string, string | null>
  status: DeckLoadStatus
  error: string | null
  selectDeck: (deckId: string | null) => void
  refresh: () => Promise<void>
  createDeck: (name: string, rows?: number, columns?: number) => Promise<Deck>
  saveDeck: (deck: Deck) => Promise<Deck>
  removeDeck: (deckId: string) => Promise<void>
  upsertButton: (deckId: string, button: DeckButton) => Promise<void>
  removeButton: (deckId: string, buttonId: string) => Promise<void>
  insertButtons: (deckId: string, buttons: DeckButton[]) => Promise<void>
  moveButton: (deckId: string, buttonId: string, page: number, row: number, column: number) => Promise<void>
  autoPlaceButton: (
    deckId: string,
    button: Omit<DeckButton, "row" | "column">,
    preferredPage?: number,
  ) => Promise<DeckButton>
}

function nowIso() {
  return new Date().toISOString()
}

function makeId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function activeDeviceId(): string | null {
  return useConnectionStore.getState().activeDeviceId
}

function clampSpan(span: number | undefined, origin: number, total: number): number {
  const raw = Math.max(1, Math.floor(span ?? 1))
  return Math.min(raw, total - origin)
}

function buttonPage(button: DeckButton): number {
  return Math.max(0, Math.floor(button.page ?? 0))
}

function cellKey(page: number, row: number, column: number): string {
  return `${page}:${row}:${column}`
}

function canPlaceButton(
  deck: Deck,
  candidate: Pick<DeckButton, "id" | "page" | "row" | "column" | "rowSpan" | "colSpan">,
): boolean {
  const page = Math.max(0, Math.floor(candidate.page ?? 0))
  const rowSpan = Math.max(1, Math.floor(candidate.rowSpan ?? 1))
  const colSpan = Math.max(1, Math.floor(candidate.colSpan ?? 1))
  if (candidate.row < 0 || candidate.column < 0) return false
  if (candidate.row + rowSpan > deck.rows || candidate.column + colSpan > deck.columns) return false

  const occupied = new Set<string>()
  for (const button of deck.buttons) {
    if (button.id === candidate.id || buttonPage(button) !== page) continue
    const rs = clampSpan(button.rowSpan, button.row, deck.rows)
    const cs = clampSpan(button.colSpan, button.column, deck.columns)
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        occupied.add(cellKey(page, button.row + dr, button.column + dc))
      }
    }
  }

  for (let dr = 0; dr < rowSpan; dr++) {
    for (let dc = 0; dc < colSpan; dc++) {
      if (occupied.has(cellKey(page, candidate.row + dr, candidate.column + dc))) return false
    }
  }

  return true
}

function maxDeckPage(deck: Deck): number {
  return deck.buttons.reduce((max, button) => Math.max(max, buttonPage(button)), 0)
}

function findPlacement(
  deck: Deck,
  rowSpan: number,
  colSpan: number,
  preferredPage = 0,
): { page: number; row: number; column: number } {
  const maxPage = Math.max(preferredPage, maxDeckPage(deck))
  for (let page = preferredPage; page <= maxPage + 1; page++) {
    for (let row = 0; row <= deck.rows - rowSpan; row++) {
      for (let column = 0; column <= deck.columns - colSpan; column++) {
        const candidate = { id: "__new__", page, row, column, rowSpan, colSpan }
        if (canPlaceButton(deck, candidate)) return { page, row, column }
      }
    }
  }
  return { page: maxPage + 1, row: 0, column: 0 }
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      decksByDevice: {},
      currentByDevice: {},
      status: "idle",
      error: null,
      selectDeck: (deckId) => {
        const id = activeDeviceId()
        if (!id) return
        set({ currentByDevice: { ...get().currentByDevice, [id]: deckId } })
      },
      refresh: async () => {
        const api = getApi()
        const id = activeDeviceId()
        if (!api || !id) return
        set({ status: "loading", error: null })
        try {
          const decks = await api.listDecks()
          const prevCurrent = get().currentByDevice[id] ?? null
          const current =
            prevCurrent && decks.some((d) => d.id === prevCurrent)
              ? prevCurrent
              : (decks[0]?.id ?? null)
          set({
            decksByDevice: { ...get().decksByDevice, [id]: decks },
            currentByDevice: { ...get().currentByDevice, [id]: current },
            status: "ready",
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to load decks"
          set({ status: "error", error: message })
        }
      },
      createDeck: async (name, rows = 3, columns = 5) => {
        const id = activeDeviceId()
        if (!id) throw new Error("No active device")
        const now = nowIso()
        const deck: Deck = {
          id: makeId(),
          name,
          rows,
          columns,
          buttons: [],
          created_at: now,
          updated_at: now,
        }
        const api = getApi()
        if (api) await api.createDeck(deck)
        const decks = [...(get().decksByDevice[id] ?? []), deck]
        set({
          decksByDevice: { ...get().decksByDevice, [id]: decks },
          currentByDevice: { ...get().currentByDevice, [id]: deck.id },
        })
        return deck
      },
      saveDeck: async (deck) => {
        const id = activeDeviceId()
        if (!id) throw new Error("No active device")
        const updated: Deck = { ...deck, updated_at: nowIso() }
        const api = getApi()
        // We deliberately trust the local payload rather than the server echo:
        // older daemons silently drop unknown fields (kind/toggle/slider/rowSpan/
        // colSpan), and using the echo would wipe them client-side too.
        if (api) await api.updateDeck(updated)
        const decks = (get().decksByDevice[id] ?? []).map((d) => (d.id === updated.id ? updated : d))
        set({ decksByDevice: { ...get().decksByDevice, [id]: decks } })
        return updated
      },
      removeDeck: async (deckId) => {
        const id = activeDeviceId()
        if (!id) return
        const api = getApi()
        if (api) await api.deleteDeck(deckId)
        const decks = (get().decksByDevice[id] ?? []).filter((d) => d.id !== deckId)
        const current =
          get().currentByDevice[id] === deckId ? (decks[0]?.id ?? null) : get().currentByDevice[id]
        set({
          decksByDevice: { ...get().decksByDevice, [id]: decks },
          currentByDevice: { ...get().currentByDevice, [id]: current ?? null },
        })
      },
      upsertButton: async (deckId, button) => {
        const id = activeDeviceId()
        if (!id) return
        const deck = (get().decksByDevice[id] ?? []).find((d) => d.id === deckId)
        if (!deck) return
        const buttons = deck.buttons.filter((b) => b.id !== button.id).concat(button)
        await get().saveDeck({ ...deck, buttons })
      },
      removeButton: async (deckId, buttonId) => {
        const id = activeDeviceId()
        if (!id) return
        const deck = (get().decksByDevice[id] ?? []).find((d) => d.id === deckId)
        if (!deck) return
        const buttons = deck.buttons.filter((b) => b.id !== buttonId)
        await get().saveDeck({ ...deck, buttons })
      },
      insertButtons: async (deckId, newButtons) => {
        const id = activeDeviceId()
        if (!id) return
        const deck = (get().decksByDevice[id] ?? []).find((d) => d.id === deckId)
        if (!deck) return
        await get().saveDeck({ ...deck, buttons: [...deck.buttons, ...newButtons] })
      },
      moveButton: async (deckId, buttonId, page, row, column) => {
        const id = activeDeviceId()
        if (!id) return
        const deck = (get().decksByDevice[id] ?? []).find((d) => d.id === deckId)
        const button = deck?.buttons.find((b) => b.id === buttonId)
        if (!deck || !button) return
        const nextButton = { ...button, page, row, column }
        if (!canPlaceButton(deck, nextButton)) return
        await get().saveDeck({
          ...deck,
          buttons: deck.buttons.map((b) => (b.id === buttonId ? nextButton : b)),
        })
      },
      autoPlaceButton: async (deckId, button, preferredPage = 0) => {
        const id = activeDeviceId()
        if (!id) throw new Error("No active device")
        const deck = (get().decksByDevice[id] ?? []).find((d) => d.id === deckId)
        if (!deck) throw new Error("Deck not found")
        const rowSpan = Math.min(Math.max(1, button.rowSpan ?? 1), deck.rows)
        const colSpan = Math.min(Math.max(1, button.colSpan ?? 1), deck.columns)
        const placement = findPlacement(deck, rowSpan, colSpan, preferredPage)
        const placed: DeckButton = {
          ...button,
          page: placement.page,
          row: placement.row,
          column: placement.column,
          rowSpan,
          colSpan,
        }
        await get().saveDeck({ ...deck, buttons: [...deck.buttons, placed] })
        return placed
      },
    }),
    {
      name: "pcdeck.decks",
      storage: createMmkvStorage(),
      partialize: (state) => ({
        decksByDevice: state.decksByDevice,
        currentByDevice: state.currentByDevice,
      }),
    },
  ),
)

const EMPTY_DECKS: Deck[] = []

/** Subscribe to the active device's decks. Uses a stable empty-array reference
 *  so React doesn't see a new snapshot every render when the active device has
 *  no decks yet (which would loop forever inside zustand). */
export function useActiveDecks(): Deck[] {
  const id = useConnectionStore((s) => s.activeDeviceId)
  return useDeckStore((s) => (id ? (s.decksByDevice[id] ?? EMPTY_DECKS) : EMPTY_DECKS))
}

/** Subscribe to the active device's current deck id. */
export function useActiveCurrentDeckId(): string | null {
  const id = useConnectionStore((s) => s.activeDeviceId)
  return useDeckStore((s) => (id ? (s.currentByDevice[id] ?? null) : null))
}

export function newButton(row: number, column: number): DeckButton {
  return {
    id: makeId(),
    page: 0,
    row,
    column,
    label: "Button",
    icon: "",
    color: null,
    kind: "button",
    action: null,
    toggle: null,
    slider: null,
  }
}
