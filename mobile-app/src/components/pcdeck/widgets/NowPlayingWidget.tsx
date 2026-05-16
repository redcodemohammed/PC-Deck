import { FC, useEffect, useRef, useState } from "react"
import { Image, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import type { NowPlayingState, NowPlayingWidgetConfig } from "@/services/pcdeck"
import { getApi } from "@/stores/connectionStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface NowPlayingWidgetProps {
  config: NowPlayingWidgetConfig
  width: number
  height: number
}

const POLL_MS = 5000

export const NowPlayingWidget: FC<NowPlayingWidgetProps> = ({ config, width, height }) => {
  const { themed } = useAppTheme()
  const [state, setState] = useState<NowPlayingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    const poll = async () => {
      const api = getApi()
      if (!api) {
        setError("Not connected")
        return
      }
      try {
        const np = await api.getNowPlaying(config.player)
        if (cancelled.current) return
        setState(np)
        setError(null)
      } catch (e) {
        if (cancelled.current) return
        setError(e instanceof Error ? e.message : "Failed to fetch")
      }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      cancelled.current = true
      clearInterval(id)
    }
  }, [config.player])

  const compact = width < 160 || height < 100

  if (error && !state) {
    return (
      <View style={themed($container)}>
        <Text style={themed($error)} text={error} />
      </View>
    )
  }

  if (!state || !state.playing) {
    return (
      <View style={themed($container)}>
        <Text style={themed($idle)} text="🎵" />
        <Text style={themed($idleText)} text="Nothing playing" />
      </View>
    )
  }

  return (
    <View style={themed($row)}>
      {!!state.art_url && (
        <Image
          source={{ uri: state.art_url }}
          style={[$art, { width: compact ? 40 : 64, height: compact ? 40 : 64 }]}
        />
      )}
      <View style={themed($info)}>
        <Text style={themed($title)} text={state.title ?? "Unknown title"} numberOfLines={1} />
        {!!state.artist && (
          <Text style={themed($artist)} text={state.artist} numberOfLines={1} />
        )}
        {!compact && !!state.album && (
          <Text style={themed($album)} text={state.album} numberOfLines={1} />
        )}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xs,
  gap: spacing.xxs,
})
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.xs,
  gap: spacing.sm,
})
const $info: ThemedStyle<ViewStyle> = () => ({ flex: 1, gap: 2 })
const $art = { borderRadius: 6 }
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
const $album: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.65,
  fontSize: 11,
})
const $idle: ThemedStyle<TextStyle> = () => ({ fontSize: 22 })
const $idleText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.7,
  fontSize: 11,
})
const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error, fontSize: 11 })
