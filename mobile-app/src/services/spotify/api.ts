import { ApisauceInstance, create } from "apisauce"

import type { SpotifyPlaybackState } from "./types"

export class SpotifyApi {
  private client: ApisauceInstance

  constructor(accessToken: string) {
    this.client = create({
      baseURL: "https://api.spotify.com/v1",
      timeout: 10000,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  /** GET /me/player — full playback state. Returns null when no active device. */
  async playbackState(): Promise<SpotifyPlaybackState | null> {
    const res = await this.client.get<SpotifyPlaybackState>("/me/player")
    if (res.status === 204) return null // no active device
    if (!res.ok) throw new Error(res.problem ?? "Spotify playback state failed")
    return res.data ?? null
  }

  async play() {
    await this.send("PUT", "/me/player/play")
  }

  async pause() {
    await this.send("PUT", "/me/player/pause")
  }

  async next() {
    await this.send("POST", "/me/player/next")
  }

  async previous() {
    await this.send("POST", "/me/player/previous")
  }

  /** PUT /me/player/volume?volume_percent=N */
  async setVolume(percent: number) {
    const v = Math.max(0, Math.min(100, Math.round(percent)))
    await this.send("PUT", `/me/player/volume?volume_percent=${v}`)
  }

  private async send(method: "PUT" | "POST", path: string) {
    const res =
      method === "PUT"
        ? await this.client.put(path)
        : await this.client.post(path)
    // 202 Accepted / 204 No Content are both success for player endpoints.
    if (res.ok || res.status === 202 || res.status === 204) return
    throw new Error(`${method} ${path} failed (${res.status})`)
  }
}
