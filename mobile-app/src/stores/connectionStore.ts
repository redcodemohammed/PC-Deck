import { create } from "zustand"
import { persist } from "zustand/middleware"

import { PcDeckApi } from "@/services/pcdeck"

import { createMmkvStorage } from "./createMmkvStorage"

export type ConnectionStatus = "idle" | "pairing" | "connected" | "error"

export interface SavedDevice {
  id: string
  host: string
  token: string
  /** Friendly name picked by the user for this tablet on that desktop. */
  deviceName: string
  /** Hostname / display name returned by the daemon at pair time. */
  desktopName: string
  /** ISO timestamp. */
  pairedAt: string
}

interface ConnectionState {
  devices: SavedDevice[]
  activeDeviceId: string | null
  status: ConnectionStatus
  error: string | null
  pair: (host: string, pairingCode: string, deviceName?: string) => Promise<SavedDevice>
  setActiveDevice: (deviceId: string | null) => void
  removeDevice: (deviceId: string) => void
  renameDevice: (deviceId: string, deviceName: string) => void
}

const DEFAULT_DEVICE_NAME = "Tablet"

let cachedApi: { deviceId: string; instance: PcDeckApi } | null = null

export function getApi(): PcDeckApi | null {
  const state = useConnectionStore.getState()
  const device = state.devices.find((d) => d.id === state.activeDeviceId)
  if (!device) return null
  if (!cachedApi || cachedApi.deviceId !== device.id) {
    cachedApi = { deviceId: device.id, instance: new PcDeckApi(device.host, device.token) }
  }
  return cachedApi.instance
}

export function getActiveDevice(): SavedDevice | null {
  const { devices, activeDeviceId } = useConnectionStore.getState()
  return devices.find((d) => d.id === activeDeviceId) ?? null
}

function makeId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      devices: [],
      activeDeviceId: null,
      status: "idle",
      error: null,
      setActiveDevice: (deviceId) => {
        cachedApi = null
        set({ activeDeviceId: deviceId })
      },
      removeDevice: (deviceId) => {
        const devices = get().devices.filter((d) => d.id !== deviceId)
        const activeDeviceId =
          get().activeDeviceId === deviceId ? (devices[0]?.id ?? null) : get().activeDeviceId
        cachedApi = null
        set({ devices, activeDeviceId })
      },
      renameDevice: (deviceId, deviceName) => {
        const devices = get().devices.map((d) =>
          d.id === deviceId ? { ...d, deviceName: deviceName || DEFAULT_DEVICE_NAME } : d,
        )
        set({ devices })
      },
      pair: async (host, pairingCode, deviceName) => {
        set({ status: "pairing", error: null })
        try {
          const api = new PcDeckApi(host)
          const name = deviceName || DEFAULT_DEVICE_NAME
          const res = await api.pair(pairingCode, name)
          const existing = get().devices.find((d) => d.host === host)
          const device: SavedDevice = {
            id: existing?.id ?? makeId(),
            host,
            token: res.token,
            deviceName: name,
            desktopName: res.desktopName,
            pairedAt: new Date().toISOString(),
          }
          const others = get().devices.filter((d) => d.id !== device.id)
          cachedApi = null
          set({
            devices: [...others, device],
            activeDeviceId: device.id,
            status: "connected",
            error: null,
          })
          return device
        } catch (e) {
          const message = e instanceof Error ? e.message : "Pairing failed"
          set({ status: "error", error: message })
          throw e
        }
      },
    }),
    {
      name: "pcdeck.connection",
      storage: createMmkvStorage(),
      partialize: (state) => ({
        devices: state.devices,
        activeDeviceId: state.activeDeviceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.status = state.devices.length ? "connected" : "idle"
      },
    },
  ),
)
