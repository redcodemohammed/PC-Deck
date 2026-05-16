import type { PersistStorage, StorageValue } from "zustand/middleware"

import { load, remove, save } from "@/utils/storage"

/**
 * Adapter so zustand's persist middleware writes through the ignite MMKV storage util.
 */
export function createMmkvStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      const value = load<StorageValue<T>>(name)
      return value ?? null
    },
    setItem: (name, value) => {
      save(name, value)
    },
    removeItem: (name) => {
      remove(name)
    },
  }
}
