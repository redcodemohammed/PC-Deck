import { getIpAddressAsync } from "expo-network"

import { DEFAULT_PROBE_TIMEOUT_MS, probeHost } from "./api"
import type { HealthResponse } from "./types"

export interface ScanResult {
  host: string
  health: HealthResponse
}

export interface ScanOptions {
  /** When provided, scan this /24 subnet (the first three octets like "192.168.1"). */
  subnet?: string
  /** Per-host probe timeout. */
  timeoutMs?: number
  /** Called as hosts are discovered. */
  onFound?: (result: ScanResult) => void
  /** Called as progress advances (0..1). */
  onProgress?: (ratio: number) => void
  signal?: AbortSignal
  /** Number of concurrent probes. */
  concurrency?: number
}

export async function localSubnet(): Promise<string | null> {
  try {
    const ip = await getIpAddressAsync()
    if (!ip || ip.split(".").length !== 4) return null
    const [a, b, c] = ip.split(".")
    if (!a || !b || !c) return null
    return `${a}.${b}.${c}`
  } catch {
    return null
  }
}

/**
 * Scans the local /24 subnet for reachable PC Deck daemons by probing /health on
 * the daemon port for each address in 1..254.
 */
export async function scanForDaemons(opts: ScanOptions = {}): Promise<ScanResult[]> {
  const subnet = opts.subnet ?? (await localSubnet())
  if (!subnet) return []

  const concurrency = Math.max(1, opts.concurrency ?? 32)
  const timeoutMs = opts.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS
  const total = 254
  const found: ScanResult[] = []
  let done = 0
  let next = 1

  const worker = async () => {
    while (true) {
      if (opts.signal?.aborted) return
      const i = next++
      if (i > total) return
      const host = `${subnet}.${i}`
      const health = await probeHost(host, timeoutMs)
      done += 1
      opts.onProgress?.(done / total)
      if (health) {
        const result = { host, health }
        found.push(result)
        opts.onFound?.(result)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return found
}
