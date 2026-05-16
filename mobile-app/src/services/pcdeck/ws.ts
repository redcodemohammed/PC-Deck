import { wsBase } from "./api"
import type { WsEvent } from "./types"

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error"

export interface WsClientOptions {
  host: string
  onEvent: (event: WsEvent) => void
  onStatus?: (status: WsStatus) => void
  reconnectDelayMs?: number
}

export class WsClient {
  private socket: WebSocket | null = null
  private closedByUser = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private opts: WsClientOptions) {}

  start() {
    this.closedByUser = false
    this.connect()
  }

  stop() {
    this.closedByUser = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
  }

  private connect() {
    this.opts.onStatus?.("connecting")
    const ws = new WebSocket(wsBase(this.opts.host))
    this.socket = ws

    ws.onopen = () => this.opts.onStatus?.("open")
    ws.onerror = () => this.opts.onStatus?.("error")
    ws.onclose = () => {
      this.opts.onStatus?.("closed")
      if (!this.closedByUser) this.scheduleReconnect()
    }
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(typeof e.data === "string" ? e.data : "") as WsEvent
        this.opts.onEvent(event)
        // The daemon's websocket loop waits for a client message after each send,
        // so we echo a tiny ack back to keep the stream flowing.
        ws.send("ack")
      } catch {
        // ignore malformed frames
      }
    }
  }

  private scheduleReconnect() {
    const delay = this.opts.reconnectDelayMs ?? 2500
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }
}
