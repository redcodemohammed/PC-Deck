import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  SpotifyApi,
  authorizeSpotify,
  refreshSpotifyTokens,
  type SpotifyTokens,
} from "@/services/spotify"

import { createMmkvStorage } from "./createMmkvStorage"

export type SpotifyStatus = "idle" | "authorizing" | "connected" | "error"

interface SpotifyState {
  clientId: string
  tokens: SpotifyTokens | null
  status: SpotifyStatus
  error: string | null
  setClientId: (id: string) => void
  connect: () => Promise<boolean>
  disconnect: () => void
  /** Returns a valid access token, refreshing if necessary. Returns null if not connected. */
  ensureFreshToken: () => Promise<string | null>
}

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set, get) => ({
      clientId: "",
      tokens: null,
      status: "idle",
      error: null,
      setClientId: (id) => set({ clientId: id.trim() }),
      connect: async () => {
        const clientId = get().clientId
        if (!clientId) {
          set({ status: "error", error: "Set a Spotify Client ID first." })
          return false
        }
        set({ status: "authorizing", error: null })
        try {
          const tokens = await authorizeSpotify(clientId)
          if (!tokens) {
            set({ status: get().tokens ? "connected" : "idle", error: null })
            return false
          }
          set({ tokens, status: "connected", error: null })
          return true
        } catch (e) {
          const message = e instanceof Error ? e.message : "Spotify authorization failed"
          set({ status: "error", error: message })
          return false
        }
      },
      disconnect: () => set({ tokens: null, status: "idle", error: null }),
      ensureFreshToken: async () => {
        const { clientId, tokens } = get()
        if (!tokens) return null
        if (Date.now() < tokens.expiresAt) return tokens.accessToken
        if (!tokens.refreshToken) {
          // Token expired and we can't refresh; force re-auth.
          set({ tokens: null, status: "idle", error: "Spotify session expired — reconnect." })
          return null
        }
        try {
          const fresh = await refreshSpotifyTokens(clientId, tokens.refreshToken)
          set({ tokens: fresh, status: "connected", error: null })
          return fresh.accessToken
        } catch (e) {
          const message = e instanceof Error ? e.message : "Spotify refresh failed"
          set({ status: "error", error: message })
          return null
        }
      },
    }),
    {
      name: "pcdeck.spotify",
      storage: createMmkvStorage(),
      partialize: (state) => ({ clientId: state.clientId, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        if (state) state.status = state.tokens ? "connected" : "idle"
      },
    },
  ),
)

/** Convenience: build an authenticated SpotifyApi instance, refreshing the token
 *  first if needed. Returns null if there's no usable session. */
export async function getSpotifyApi(): Promise<SpotifyApi | null> {
  const token = await useSpotifyStore.getState().ensureFreshToken()
  if (!token) return null
  return new SpotifyApi(token)
}
