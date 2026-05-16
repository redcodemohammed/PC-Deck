import { ApisauceInstance, create } from "apisauce"

import type {
  AppsResponse,
  DaemonStatus,
  Deck,
  ExecuteActionResponse,
  HealthResponse,
  InstalledApp,
  NowPlayingState,
  PairResponse,
} from "./types"

export const DAEMON_PORT = 41730
export const DEFAULT_PROBE_TIMEOUT_MS = 600

export const httpBase = (host: string) => `http://${host}:${DAEMON_PORT}`
export const wsBase = (host: string) => `ws://${host}:${DAEMON_PORT}/ws`

export class PcDeckApi {
  private client: ApisauceInstance
  private token: string | null = null
  private host: string

  constructor(host: string, token?: string) {
    this.host = host
    this.client = create({
      baseURL: httpBase(host),
      timeout: 10000,
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
    })
    if (token) this.setToken(token)
  }

  getHost() {
    return this.host
  }

  setToken(token: string) {
    this.token = token
    this.client.setHeader("x-pcdeck-token", token)
  }

  async health() {
    const res = await this.client.get<HealthResponse>("/health")
    if (!res.ok) throw new Error(res.problem ?? "health check failed")
    return res.data!
  }

  async status() {
    const res = await this.client.get<DaemonStatus>("/status")
    if (!res.ok) throw new Error(res.problem ?? "status failed")
    return res.data!
  }

  async pair(pairingCode: string, deviceName: string) {
    const res = await this.client.post<PairResponse>("/pair", { pairingCode, deviceName })
    if (!res.ok) {
      const reason = res.status === 401 ? "Invalid pairing code" : (res.problem ?? "Pair failed")
      throw new Error(reason)
    }
    return res.data!
  }

  async listDecks() {
    const res = await this.client.get<Deck[]>("/decks")
    if (!res.ok) throw new Error(res.problem ?? "list decks failed")
    return res.data!
  }

  async createDeck(deck: Deck) {
    const res = await this.client.post<Deck>("/decks", deck)
    if (!res.ok) throw new Error(res.problem ?? "create deck failed")
    return res.data!
  }

  async updateDeck(deck: Deck) {
    const res = await this.client.put<Deck>(`/decks/${deck.id}`, deck)
    if (!res.ok) throw new Error(res.problem ?? "update deck failed")
    return res.data!
  }

  async deleteDeck(deckId: string) {
    const res = await this.client.delete(`/decks/${deckId}`)
    if (!res.ok) throw new Error(res.problem ?? "delete deck failed")
  }

  async executeAction(deckId: string, buttonId: string, actionId: string) {
    const res = await this.client.post<ExecuteActionResponse>("/actions/execute", {
      deckId,
      buttonId,
      actionId,
    })
    if (!res.ok) throw new Error(res.problem ?? "execute failed")
    return res.data!
  }

  async setSliderValue(deckId: string, buttonId: string, value: number) {
    const res = await this.client.post<ExecuteActionResponse>("/actions/slider", {
      deckId,
      buttonId,
      value,
    })
    if (!res.ok) throw new Error(res.problem ?? "slider update failed")
    return res.data!
  }

  async actionTypes() {
    const res = await this.client.get<{ types: string[] }>("/actions/types")
    if (!res.ok) throw new Error(res.problem ?? "action types failed")
    return res.data!
  }

  async getNowPlaying(player?: string): Promise<NowPlayingState> {
    const res = await this.client.get<NowPlayingState>("/widgets/now_playing", player ? { player } : undefined)
    if (!res.ok) throw new Error(res.problem ?? "now_playing failed")
    return res.data!
  }

  async controlNowPlaying(
    action: "playpause" | "play" | "pause" | "next" | "prev" | "stop",
    player?: string,
  ) {
    const res = await this.client.post<{ ok: boolean }>("/widgets/now_playing/control", {
      action,
      player,
    })
    if (!res.ok) throw new Error(res.problem ?? "now_playing control failed")
    return res.data!
  }

  async listApps(): Promise<InstalledApp[]> {
    const res = await this.client.get<AppsResponse | InstalledApp[]>("/apps")
    if (!res.ok) throw new Error(res.problem ?? "app list failed")
    const data = res.data!
    return Array.isArray(data) ? data : (data.apps ?? [])
  }
}

/**
 * Probe a single host:port for a PC-Deck daemon and return its health doc if reachable.
 * Returns null on any failure (timeout, refused, non-200, malformed JSON, etc.).
 */
export async function probeHost(
  host: string,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<HealthResponse | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${httpBase(host)}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const body = (await res.json()) as HealthResponse
    return body?.ok ? body : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
