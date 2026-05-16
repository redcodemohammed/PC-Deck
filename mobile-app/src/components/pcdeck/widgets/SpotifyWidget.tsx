import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Image, Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { Text } from "@/components/Text"
import type { SpotifyPlaybackState } from "@/services/spotify"
import { getSpotifyApi, useSpotifyStore } from "@/stores/spotifyStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface SpotifyWidgetProps {
  width: number
  height: number
}

const POLL_MS = 5000

export const SpotifyWidget: FC<SpotifyWidgetProps> = ({ width, height }) => {
  const { themed, theme } = useAppTheme()
  const router = useRouter()
  const clientId = useSpotifyStore((s) => s.clientId)
  const tokens = useSpotifyStore((s) => s.tokens)
  const connect = useSpotifyStore((s) => s.connect)
  const status = useSpotifyStore((s) => s.status)

  const [state, setState] = useState<SpotifyPlaybackState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelled = useRef(false)

  const fetchState = useCallback(async () => {
    const api = await getSpotifyApi()
    if (!api) return
    try {
      const playback = await api.playbackState()
      if (cancelled.current) return
      setState(playback)
      setError(null)
    } catch (e) {
      if (cancelled.current) return
      setError(e instanceof Error ? e.message : "Spotify error")
    }
  }, [])

  useEffect(() => {
    cancelled.current = false
    if (!tokens) {
      setState(null)
      return
    }
    fetchState()
    const id = setInterval(fetchState, POLL_MS)
    return () => {
      cancelled.current = true
      clearInterval(id)
    }
  }, [tokens, fetchState])

  const runControl = async (op: "playpause" | "next" | "prev") => {
    const api = await getSpotifyApi()
    if (!api) return
    try {
      if (op === "next") await api.next()
      else if (op === "prev") await api.previous()
      else if (state?.is_playing) await api.pause()
      else await api.play()
      // Refresh quickly so the UI reflects the change.
      setTimeout(fetchState, 400)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spotify control failed")
    }
  }

  const compact = width < 200 || height < 140

  if (!clientId) {
    return (
      <Pressable onPress={() => router.push("/settings")} style={themed($center)}>
        <Text style={themed($brand)} text="Spotify" />
        <Text style={themed($prompt)} text="Add a Client ID in Settings" />
      </Pressable>
    )
  }

  if (!tokens) {
    return (
      <Pressable
        onPress={() => {
          if (status !== "authorizing") connect()
        }}
        style={themed($center)}
      >
        <Text style={themed($brand)} text="Spotify" />
        <Text
          style={themed($prompt)}
          text={status === "authorizing" ? "Opening Spotify…" : "Tap to connect"}
        />
      </Pressable>
    )
  }

  if (error && !state) {
    return (
      <View style={themed($center)}>
        <Text style={themed($brand)} text="Spotify" />
        <Text style={themed($error)} text={error} />
      </View>
    )
  }

  if (!state || !state.item) {
    return (
      <View style={themed($center)}>
        <Text style={themed($brand)} text="Spotify" />
        <Text style={themed($prompt)} text="Nothing playing" />
      </View>
    )
  }

  const track = state.item
  const artwork = track.album.images?.[0]?.url
  const artistLine = track.artists.map((a) => a.name).join(", ")
  const artSize = compact ? 44 : 72

  return (
    <View style={themed($container)}>
      <View style={themed($row)}>
        {!!artwork && (
          <Image
            source={{ uri: artwork }}
            style={[$art, { width: artSize, height: artSize }]}
          />
        )}
        <View style={themed($info)}>
          <Text style={themed($brandSm)} text="SPOTIFY" />
          <Text style={themed($title)} text={track.name} numberOfLines={1} />
          <Text style={themed($artist)} text={artistLine} numberOfLines={1} />
        </View>
      </View>
      <View style={themed($controls)}>
        <Pressable
          onPress={() => runControl("prev")}
          style={({ pressed }) => [themed($controlBtn), pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Text style={themed($controlIcon)} text="⏮" />
        </Pressable>
        <Pressable
          onPress={() => runControl("playpause")}
          style={({ pressed }) => [
            themed($controlBtn),
            { backgroundColor: theme.colors.palette.neutral100 },
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={8}
        >
          <Text
            style={[themed($controlIcon), { color: theme.colors.palette.neutral800 }]}
            text={state.is_playing ? "⏸" : "▶"}
          />
        </Pressable>
        <Pressable
          onPress={() => runControl("next")}
          style={({ pressed }) => [themed($controlBtn), pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Text style={themed($controlIcon)} text="⏭" />
        </Pressable>
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.xs,
  justifyContent: "space-between",
  gap: spacing.xs,
})
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})
const $info: ThemedStyle<ViewStyle> = () => ({ flex: 1, gap: 2 })
const $art = { borderRadius: 6 }
const $brand: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "800",
  fontSize: 18,
  letterSpacing: 1,
})
const $brandSm: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.55,
  fontWeight: "800",
  fontSize: 10,
  letterSpacing: 1.2,
})
const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "700",
  fontSize: 14,
})
const $artist: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.85,
  fontSize: 12,
})
const $prompt: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.8,
  fontSize: 12,
  textAlign: "center",
})
const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  fontSize: 11,
  textAlign: "center",
})
const $center: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xxs,
  padding: spacing.xs,
})
const $controls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
})
const $controlBtn: ThemedStyle<ViewStyle> = () => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
})
const $controlIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 14,
  fontWeight: "700",
})
