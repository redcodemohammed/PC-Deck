import { FC, useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { useRouter } from "expo-router"
import Slider from "@react-native-community/slider"
import { Button as PaperButton, Icon, IconButton, Text as PaperText } from "react-native-paper"

import type { SpotifyPlaybackState, SpotifyRepeatMode } from "@/services/spotify"
import { getSpotifyApi, useSpotifyStore } from "@/stores/spotifyStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface SpotifyWidgetProps {
  width: number
  height: number
}

const POLL_MS = 5000
const SPOTIFY_GREEN = "#1DB954"
const SPOTIFY_BG = "#181818"
const SPOTIFY_BG_RAISED = "#282828"
const TEXT_PRIMARY = "#FFFFFF"
const TEXT_DIM = "rgba(255,255,255,0.7)"
const TEXT_FAINT = "rgba(255,255,255,0.55)"

const REPEAT_ORDER: SpotifyRepeatMode[] = ["off", "context", "track"]
const REPEAT_ICON: Record<SpotifyRepeatMode, string> = {
  off: "repeat-off",
  context: "repeat",
  track: "repeat-once",
}

function nextRepeat(mode: SpotifyRepeatMode): SpotifyRepeatMode {
  const i = REPEAT_ORDER.indexOf(mode)
  return REPEAT_ORDER[(i + 1) % REPEAT_ORDER.length]
}

export const SpotifyWidget: FC<SpotifyWidgetProps> = ({ width, height }) => {
  const { themed } = useAppTheme()
  const router = useRouter()
  const clientId = useSpotifyStore((s) => s.clientId)
  const tokens = useSpotifyStore((s) => s.tokens)
  const connect = useSpotifyStore((s) => s.connect)
  const status = useSpotifyStore((s) => s.status)

  const [state, setState] = useState<SpotifyPlaybackState | null>(null)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [volumeOverride, setVolumeOverride] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  const fetchState = useCallback(async () => {
    const api = await getSpotifyApi()
    if (!api) return
    try {
      const playback = await api.playbackState()
      if (cancelled.current) return
      setState(playback)
      setError(null)
      if (playback?.item?.id) {
        try {
          const [isLiked] = await api.checkSaved([playback.item.id])
          if (!cancelled.current) setLiked(!!isLiked)
        } catch {
          // ignore — liked lookup is best-effort
        }
      } else {
        setLiked(null)
      }
    } catch (e) {
      if (cancelled.current) return
      setError(e instanceof Error ? e.message : "Spotify error")
    }
  }, [])

  useEffect(() => {
    cancelled.current = false
    if (!tokens) {
      setState(null)
      setLiked(null)
      return
    }
    fetchState()
    const id = setInterval(fetchState, POLL_MS)
    return () => {
      cancelled.current = true
      clearInterval(id)
    }
  }, [tokens, fetchState])

  type ControlOp =
    | { op: "playpause" }
    | { op: "next" }
    | { op: "prev" }
    | { op: "shuffle" }
    | { op: "repeat" }
    | { op: "like" }
    | { op: "volume"; value: number }
    | { op: "seek"; value: number }

  const run = async (action: ControlOp) => {
    if (busy) return
    setBusy(true)
    const api = await getSpotifyApi()
    if (!api) {
      setBusy(false)
      return
    }
    try {
      switch (action.op) {
        case "playpause":
          if (state?.is_playing) await api.pause()
          else await api.play()
          break
        case "next":
          await api.next()
          break
        case "prev":
          await api.previous()
          break
        case "shuffle":
          await api.setShuffle(!state?.shuffle_state)
          break
        case "repeat":
          await api.setRepeat(nextRepeat(state?.repeat_state ?? "off"))
          break
        case "like": {
          const trackId = state?.item?.id
          if (!trackId) break
          if (liked) {
            await api.unsaveTrack(trackId)
            setLiked(false)
          } else {
            await api.saveTrack(trackId)
            setLiked(true)
          }
          break
        }
        case "volume":
          await api.setVolume(action.value)
          break
        case "seek":
          await api.seek(action.value)
          break
      }
      setTimeout(() => {
        fetchState().finally(() => setBusy(false))
      }, 350)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spotify control failed")
      setBusy(false)
    }
  }

  const compact = width < 240 || height < 170

  if (!clientId) {
    return (
      <Shell themed={themed}>
        <BrandRow compact={compact} />
        <View style={themed($center)}>
          <PaperText style={themed($promptText)}>Add a Client ID in Settings</PaperText>
          <PaperButton
            mode="contained"
            buttonColor={SPOTIFY_GREEN}
            textColor="#000"
            icon="cog"
            onPress={() => router.push("/settings")}
            style={themed($cta)}
          >
            Open Settings
          </PaperButton>
        </View>
      </Shell>
    )
  }

  if (!tokens) {
    return (
      <Shell themed={themed}>
        <BrandRow compact={compact} />
        <View style={themed($center)}>
          {status === "authorizing" ? (
            <ActivityIndicator color={SPOTIFY_GREEN} />
          ) : (
            <PaperText style={themed($promptText)}>Connect your account</PaperText>
          )}
          <PaperButton
            mode="contained"
            buttonColor={SPOTIFY_GREEN}
            textColor="#000"
            icon="login"
            disabled={status === "authorizing"}
            onPress={() => connect()}
            style={themed($cta)}
          >
            {status === "authorizing" ? "Opening Spotify…" : "Connect"}
          </PaperButton>
        </View>
      </Shell>
    )
  }

  if (error && !state) {
    return (
      <Shell themed={themed}>
        <BrandRow compact={compact} />
        <View style={themed($center)}>
          <PaperText style={themed($errorText)}>{error}</PaperText>
        </View>
      </Shell>
    )
  }

  if (!state || !state.item) {
    return (
      <Shell themed={themed}>
        <BrandRow compact={compact} />
        <View style={themed($center)}>
          <Icon source="music-note-off-outline" color={TEXT_DIM} size={28} />
          <PaperText style={themed($promptText)}>Nothing playing</PaperText>
          <PaperText style={themed($helperText)}>
            Open Spotify on a device to begin.
          </PaperText>
        </View>
      </Shell>
    )
  }

  const track = state.item
  const artwork = track.album.images?.[0]?.url
  const artistLine = track.artists.map((a) => a.name).join(", ")
  const progressPct =
    typeof state.progress_ms === "number" && track.duration_ms
      ? Math.min(100, Math.max(0, (state.progress_ms / track.duration_ms) * 100))
      : 0
  const deviceVolume = state.device?.volume_percent ?? 50
  const volumeValue = volumeOverride ?? deviceVolume

  if (compact) {
    return (
      <Shell themed={themed}>
        <View style={themed($compactRow)}>
          {!!artwork && (
            <Image source={{ uri: artwork }} style={[themed($artCompact), styles.art]} />
          )}
          <View style={themed($info)}>
            <PaperText variant="labelSmall" style={themed($brandTag)}>
              SPOTIFY
            </PaperText>
            <PaperText style={themed($title)} numberOfLines={1}>
              {track.name}
            </PaperText>
            <PaperText style={themed($artist)} numberOfLines={1}>
              {artistLine}
            </PaperText>
          </View>
          {liked !== null && (
            <IconButton
              icon={liked ? "heart" : "heart-outline"}
              iconColor={liked ? SPOTIFY_GREEN : TEXT_PRIMARY}
              size={20}
              disabled={busy}
              onPress={() => run({ op: "like" })}
              accessibilityLabel={liked ? "Remove from Liked" : "Save to Liked"}
            />
          )}
        </View>
        <Controls
          isPlaying={!!state.is_playing}
          shuffle={!!state.shuffle_state}
          repeat={state.repeat_state ?? "off"}
          busy={busy}
          showExtras={false}
          onPrev={() => run({ op: "prev" })}
          onPlayPause={() => run({ op: "playpause" })}
          onNext={() => run({ op: "next" })}
          onShuffle={() => run({ op: "shuffle" })}
          onRepeat={() => run({ op: "repeat" })}
        />
        <ProgressBar percent={progressPct} />
      </Shell>
    )
  }

  return (
    <Shell themed={themed}>
      <View style={themed($largeRow)}>
        {!!artwork && (
          <Image source={{ uri: artwork }} style={[themed($artLarge), styles.art]} />
        )}
        <View style={themed($info)}>
          <PaperText variant="labelSmall" style={themed($brandTag)}>
            SPOTIFY{state.device?.name ? ` · ${state.device.name}` : ""}
          </PaperText>
          <PaperText style={themed($titleLarge)} numberOfLines={2}>
            {track.name}
          </PaperText>
          <PaperText style={themed($artist)} numberOfLines={1}>
            {artistLine}
          </PaperText>
          <PaperText style={themed($album)} numberOfLines={1}>
            {track.album.name}
          </PaperText>
        </View>
        {liked !== null && (
          <IconButton
            icon={liked ? "heart" : "heart-outline"}
            iconColor={liked ? SPOTIFY_GREEN : TEXT_PRIMARY}
            size={24}
            disabled={busy}
            onPress={() => run({ op: "like" })}
            accessibilityLabel={liked ? "Remove from Liked" : "Save to Liked"}
          />
        )}
      </View>

      <ProgressBar percent={progressPct} />

      <Controls
        isPlaying={!!state.is_playing}
        shuffle={!!state.shuffle_state}
        repeat={state.repeat_state ?? "off"}
        busy={busy}
        showExtras
        onPrev={() => run({ op: "prev" })}
        onPlayPause={() => run({ op: "playpause" })}
        onNext={() => run({ op: "next" })}
        onShuffle={() => run({ op: "shuffle" })}
        onRepeat={() => run({ op: "repeat" })}
      />

      <View style={themed($volumeRow)}>
        <Icon source="volume-low" color={TEXT_DIM} size={16} />
        <Slider
          style={themed($volumeSlider) as ViewStyle}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={volumeValue}
          onValueChange={setVolumeOverride}
          onSlidingComplete={(v) => {
            setVolumeOverride(null)
            run({ op: "volume", value: Math.round(v) })
          }}
          minimumTrackTintColor={SPOTIFY_GREEN}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={TEXT_PRIMARY}
        />
        <Icon source="volume-high" color={TEXT_DIM} size={16} />
        <PaperText style={themed($volumeValue)}>{Math.round(volumeValue)}</PaperText>
      </View>
    </Shell>
  )
}

const Shell: FC<{ themed: ReturnType<typeof useAppTheme>["themed"]; children: React.ReactNode }> = ({
  themed,
  children,
}) => <View style={themed($shell)}>{children}</View>

const BrandRow: FC<{ compact: boolean }> = ({ compact }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($brandRow)}>
      <Icon source="spotify" size={compact ? 22 : 28} color={SPOTIFY_GREEN} />
      <PaperText style={themed($brandTitle)}>Spotify</PaperText>
    </View>
  )
}

interface ControlsProps {
  isPlaying: boolean
  shuffle: boolean
  repeat: SpotifyRepeatMode
  busy: boolean
  showExtras: boolean
  onPrev: () => void
  onPlayPause: () => void
  onNext: () => void
  onShuffle: () => void
  onRepeat: () => void
}

const Controls: FC<ControlsProps> = ({
  isPlaying,
  shuffle,
  repeat,
  busy,
  showExtras,
  onPrev,
  onPlayPause,
  onNext,
  onShuffle,
  onRepeat,
}) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($controls)}>
      {showExtras && (
        <IconButton
          icon={shuffle ? "shuffle-variant" : "shuffle-disabled"}
          iconColor={shuffle ? SPOTIFY_GREEN : TEXT_DIM}
          size={20}
          disabled={busy}
          onPress={onShuffle}
          accessibilityLabel="Toggle shuffle"
        />
      )}
      <IconButton
        icon="skip-previous"
        iconColor={TEXT_PRIMARY}
        size={26}
        disabled={busy}
        onPress={onPrev}
        accessibilityLabel="Previous track"
      />
      <IconButton
        icon={isPlaying ? "pause" : "play"}
        mode="contained"
        containerColor={SPOTIFY_GREEN}
        iconColor="#000"
        size={36}
        disabled={busy}
        onPress={onPlayPause}
        accessibilityLabel={isPlaying ? "Pause" : "Play"}
      />
      <IconButton
        icon="skip-next"
        iconColor={TEXT_PRIMARY}
        size={26}
        disabled={busy}
        onPress={onNext}
        accessibilityLabel="Next track"
      />
      {showExtras && (
        <IconButton
          icon={REPEAT_ICON[repeat]}
          iconColor={repeat === "off" ? TEXT_DIM : SPOTIFY_GREEN}
          size={20}
          disabled={busy}
          onPress={onRepeat}
          accessibilityLabel="Cycle repeat mode"
        />
      )}
    </View>
  )
}

const ProgressBar: FC<{ percent: number }> = ({ percent }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($progressTrack)}>
      <View style={[themed($progressFill), { width: `${percent}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  art: { resizeMode: "cover" },
})

const $shell: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.sm,
  backgroundColor: SPOTIFY_BG,
  gap: spacing.xs,
  justifyContent: "space-between",
})

const $brandRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
})

const $brandTitle: ThemedStyle<TextStyle> = () => ({
  color: TEXT_PRIMARY,
  fontWeight: "800",
  fontSize: 16,
  letterSpacing: 0.5,
})

const $brandTag: ThemedStyle<TextStyle> = () => ({
  color: SPOTIFY_GREEN,
  fontWeight: "800",
  letterSpacing: 1.2,
  fontSize: 10,
})

const $compactRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $largeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
})

const $info: ThemedStyle<ViewStyle> = () => ({ flex: 1, gap: 2 })

const $artCompact: ThemedStyle<ImageStyle> = () => ({
  width: 48,
  height: 48,
  borderRadius: 6,
  backgroundColor: SPOTIFY_BG_RAISED,
})

const $artLarge: ThemedStyle<ImageStyle> = () => ({
  width: 96,
  height: 96,
  borderRadius: 8,
  backgroundColor: SPOTIFY_BG_RAISED,
})

const $title: ThemedStyle<TextStyle> = () => ({
  color: TEXT_PRIMARY,
  fontWeight: "700",
  fontSize: 14,
})

const $titleLarge: ThemedStyle<TextStyle> = () => ({
  color: TEXT_PRIMARY,
  fontWeight: "800",
  fontSize: 18,
  lineHeight: 22,
})

const $artist: ThemedStyle<TextStyle> = () => ({ color: TEXT_DIM, fontSize: 12 })
const $album: ThemedStyle<TextStyle> = () => ({ color: TEXT_FAINT, fontSize: 11 })

const $progressTrack: ThemedStyle<ViewStyle> = () => ({
  height: 3,
  borderRadius: 2,
  backgroundColor: "rgba(255,255,255,0.15)",
  overflow: "hidden",
})

const $progressFill: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  backgroundColor: SPOTIFY_GREEN,
})

const $controls: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})

const $volumeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $volumeSlider: ThemedStyle<ViewStyle> = () => ({ flex: 1, height: 32 })

const $volumeValue: ThemedStyle<TextStyle> = () => ({
  color: TEXT_DIM,
  fontSize: 11,
  minWidth: 24,
  textAlign: "right",
})

const $center: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $promptText: ThemedStyle<TextStyle> = () => ({
  color: TEXT_PRIMARY,
  fontSize: 13,
  textAlign: "center",
})

const $helperText: ThemedStyle<TextStyle> = () => ({
  color: TEXT_FAINT,
  fontSize: 11,
  textAlign: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  fontSize: 12,
  textAlign: "center",
})

const $cta: ThemedStyle<ViewStyle> = () => ({ borderRadius: 999 })
