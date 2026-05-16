import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { Icon, IconButton, Text as PaperText } from "react-native-paper"

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
  const { themed, theme } = useAppTheme()
  const [state, setState] = useState<NowPlayingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  const fetchState = useCallback(async () => {
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
  }, [config.player])

  useEffect(() => {
    cancelled.current = false
    fetchState()
    const id = setInterval(fetchState, POLL_MS)
    return () => {
      cancelled.current = true
      clearInterval(id)
    }
  }, [fetchState])

  const control = async (action: "playpause" | "next" | "prev") => {
    if (busy) return
    const api = getApi()
    if (!api) return
    setBusy(true)
    try {
      await api.controlNowPlaying(action, config.player)
      // Give the player a moment to update, then refetch.
      setTimeout(() => fetchState().finally(() => setBusy(false)), 400)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Control failed")
      setBusy(false)
    }
  }

  const compact = width < 220 || height < 140
  const playing = !!state?.playing
  const hasTrack = !!(state?.title || state?.artist)

  if (error && !state) {
    return (
      <View style={themed($container)}>
        <Text label="Now playing" tag />
        <PaperText style={themed($errorText)}>{error}</PaperText>
      </View>
    )
  }

  if (!hasTrack) {
    return (
      <View style={themed($container)}>
        <Text label="Now playing" tag />
        <View style={themed($center)}>
          <Icon
            source="music-note-off-outline"
            size={compact ? 24 : 32}
            color={theme.colors.palette.neutral100}
          />
          <PaperText style={themed($idleText)}>Nothing playing</PaperText>
        </View>
        <Controls
          playing={playing}
          busy={busy}
          color={theme.colors.palette.neutral100}
          onPrev={() => control("prev")}
          onPlayPause={() => control("playpause")}
          onNext={() => control("next")}
        />
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      <View style={themed($row)}>
        {state?.art_url ? (
          <Image
            source={{ uri: state.art_url }}
            style={[themed($art), { width: compact ? 44 : 64, height: compact ? 44 : 64 }]}
          />
        ) : (
          <View
            style={[themed($artFallback), { width: compact ? 44 : 64, height: compact ? 44 : 64 }]}
          >
            <Icon source="music" size={compact ? 22 : 28} color={theme.colors.palette.neutral100} />
          </View>
        )}
        <View style={themed($info)}>
          {!!state?.player && (
            <PaperText variant="labelSmall" style={themed($brandTag)}>
              {state.player.toUpperCase()}
            </PaperText>
          )}
          <PaperText style={themed($title)} numberOfLines={1}>
            {state?.title ?? "Unknown title"}
          </PaperText>
          {!!state?.artist && (
            <PaperText style={themed($artist)} numberOfLines={1}>
              {state.artist}
            </PaperText>
          )}
          {!compact && !!state?.album && (
            <PaperText style={themed($album)} numberOfLines={1}>
              {state.album}
            </PaperText>
          )}
        </View>
      </View>
      <Controls
        playing={playing}
        busy={busy}
        color={theme.colors.palette.neutral100}
        onPrev={() => control("prev")}
        onPlayPause={() => control("playpause")}
        onNext={() => control("next")}
      />
    </View>
  )
}

interface ControlsProps {
  playing: boolean
  busy: boolean
  color: string
  onPrev: () => void
  onPlayPause: () => void
  onNext: () => void
}

const Controls: FC<ControlsProps> = ({ playing, busy, color, onPrev, onPlayPause, onNext }) => {
  const { themed, theme } = useAppTheme()
  return (
    <View style={themed($controls)}>
      <IconButton
        icon="skip-previous"
        iconColor={color}
        size={22}
        disabled={busy}
        onPress={onPrev}
        accessibilityLabel="Previous track"
      />
      <IconButton
        icon={playing ? "pause" : "play"}
        mode="contained"
        containerColor={theme.colors.palette.neutral100}
        iconColor={theme.colors.palette.neutral800}
        size={28}
        disabled={busy}
        onPress={onPlayPause}
        accessibilityLabel={playing ? "Pause" : "Play"}
      />
      <IconButton
        icon="skip-next"
        iconColor={color}
        size={22}
        disabled={busy}
        onPress={onNext}
        accessibilityLabel="Next track"
      />
    </View>
  )
}

const Text: FC<{ label: string; tag?: boolean }> = ({ label, tag }) => {
  const { themed } = useAppTheme()
  return (
    <PaperText
      variant={tag ? "labelSmall" : "bodyMedium"}
      style={tag ? themed($brandTag) : themed($title)}
    >
      {tag ? label.toUpperCase() : label}
    </PaperText>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.xs,
  gap: spacing.xs,
  justifyContent: "space-between",
})
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})
const $info: ThemedStyle<ViewStyle> = () => ({ flex: 1, gap: 2 })
const $art: ThemedStyle<ImageStyle> = () => ({ borderRadius: 6 })
const $artFallback: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: 6,
  backgroundColor: colors.palette.secondary300,
  alignItems: "center",
  justifyContent: "center",
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
const $album: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.65,
  fontSize: 11,
})
const $brandTag: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.55,
  fontWeight: "800",
  letterSpacing: 1.2,
  fontSize: 10,
})
const $idleText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.7,
  fontSize: 12,
})
const $center: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xxs,
  flex: 1,
})
const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error, fontSize: 11 })
const $controls: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})
