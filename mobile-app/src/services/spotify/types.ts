export interface SpotifyImage {
  url: string
  width?: number
  height?: number
}

export interface SpotifyArtist {
  id: string
  name: string
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  duration_ms: number
}

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  is_active: boolean
  volume_percent?: number
}

export interface SpotifyPlaybackState {
  is_playing: boolean
  progress_ms: number | null
  item: SpotifyTrack | null
  device: SpotifyDevice | null
  shuffle_state?: boolean
  repeat_state?: "off" | "track" | "context"
}

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string | null
  /** Epoch ms when the access token expires. */
  expiresAt: number
  scope: string
}
