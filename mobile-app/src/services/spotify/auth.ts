import type { SpotifyTokens } from "./types"

/**
 * NOTE: `expo-auth-session` brings in `expo-web-browser`, which is a native
 * module. We dynamic-import it inside `authorizeSpotify` / `refreshSpotifyTokens`
 * so that screens which merely _reference_ this file (e.g. SettingsScreen) don't
 * crash when the native binary is out-of-date. The actual call will throw a
 * useful error that the store surfaces in the UI.
 */

export const SPOTIFY_DISCOVERY = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
}

export const SPOTIFY_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
]

export const SPOTIFY_REDIRECT_PATH = "spotify-callback"

/**
 * Hardcoded redirect URI. We deliberately don't use `Linking.createURL` here
 * because in a dev client it produces something like
 * `exp+pc-deck-app://expo-development-client/?url=…&path=spotify-callback`,
 * which Spotify's redirect then deep-links back through expo-router and 404s
 * on `/spotify-callback`. A clean `pcdeck://spotify-callback` lets
 * `openAuthSessionAsync` intercept the redirect inside the auth tab.
 */
export function getSpotifyRedirectUri(): string {
  return `pcdeck://${SPOTIFY_REDIRECT_PATH}`
}

interface RawTokenResponse {
  accessToken: string
  refreshToken?: string | null
  expiresIn?: number
  scope?: string
}

function withExpiresAt(token: RawTokenResponse, fallbackRefresh?: string | null): SpotifyTokens {
  const expiresIn = token.expiresIn ?? 3600
  // Subtract a safety margin so we refresh before the token actually expires.
  const expiresAt = Date.now() + Math.max(0, expiresIn - 60) * 1000
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? fallbackRefresh ?? null,
    expiresAt,
    scope: token.scope ?? "",
  }
}

export async function authorizeSpotify(clientId: string): Promise<SpotifyTokens | null> {
  if (!clientId) throw new Error("Missing Spotify client id")

  let AuthSession: typeof import("expo-auth-session")
  try {
    AuthSession = await import("expo-auth-session")
  } catch {
    throw new Error(
      "Spotify auth is unavailable — rebuild the app (pnpm android / pnpm ios) so the expo-auth-session native module is bundled.",
    )
  }

  const redirectUri = getSpotifyRedirectUri()
  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: SPOTIFY_SCOPES,
    usePKCE: true,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
  })
  await request.makeAuthUrlAsync(SPOTIFY_DISCOVERY)
  const result = await request.promptAsync(SPOTIFY_DISCOVERY)
  if (result.type !== "success") return null
  const code = result.params.code
  if (!code) throw new Error("Spotify did not return an authorization code")
  if (result.params.error) throw new Error(`Spotify error: ${result.params.error}`)

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
    },
    SPOTIFY_DISCOVERY,
  )
  return withExpiresAt(tokenResponse)
}

export async function refreshSpotifyTokens(
  clientId: string,
  refreshToken: string,
): Promise<SpotifyTokens> {
  if (!clientId) throw new Error("Missing Spotify client id")
  if (!refreshToken) throw new Error("Missing Spotify refresh token")

  let AuthSession: typeof import("expo-auth-session")
  try {
    AuthSession = await import("expo-auth-session")
  } catch {
    throw new Error(
      "Spotify auth is unavailable — rebuild the app so the expo-auth-session native module is bundled.",
    )
  }

  const tokenResponse = await AuthSession.refreshAsync(
    { clientId, refreshToken },
    SPOTIFY_DISCOVERY,
  )
  return withExpiresAt(tokenResponse, refreshToken)
}
