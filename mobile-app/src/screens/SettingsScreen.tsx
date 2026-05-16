import { FC, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"
import { Card } from "react-native-paper"

import { Button } from "@/components/Button"
import { ConnectionStatus } from "@/components/pcdeck"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { DaemonStatus, HealthResponse } from "@/services/pcdeck"
import { getSpotifyRedirectUri } from "@/services/spotify"
import { getApi, useConnectionStore } from "@/stores/connectionStore"
import { useSpotifyStore } from "@/stores/spotifyStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const SettingsScreen: FC = function SettingsScreen() {
  const { themed } = useAppTheme()
  const router = useRouter()

  const activeDeviceId = useConnectionStore((s) => s.activeDeviceId)
  const device = useConnectionStore((s) => s.devices.find((d) => d.id === s.activeDeviceId) ?? null)
  const pairingStatus = useConnectionStore((s) => s.status)
  const removeDevice = useConnectionStore((s) => s.removeDevice)

  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [status, setStatus] = useState<DaemonStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!device) return
    const api = getApi()
    if (!api) return
    Promise.all([api.health(), api.status()])
      .then(([h, s]) => {
        if (cancelled) return
        setHealth(h)
        setStatus(s)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load daemon status")
      })
    return () => {
      cancelled = true
    }
  }, [device])

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" text="Settings" />

      <Section title="Connection">
        <ConnectionStatus
          pairing={pairingStatus}
          socket="idle"
          desktopName={device?.desktopName}
          host={device?.host}
        />
        <Row label="Device name" value={device?.deviceName ?? "—"} />
        <Row label="Host" value={device?.host ?? "—"} />
        {!!health && (
          <Row label="Daemon" value={`${health.name} v${health.version} · ${health.platform}`} />
        )}
        {!!status && (
          <Row label="Shell commands" value={status.shellCommandEnabled ? "Enabled" : "Disabled"} />
        )}
        {!!error && <Text style={themed($error)} text={error} />}

        <View style={themed($actions)}>
          <Button
            preset="default"
            text="Switch device"
            onPress={() => router.push("/devices")}
            style={themed($actionBtn)}
          />
          <Button
            preset="reversed"
            text="Disconnect"
            onPress={() => {
              if (!activeDeviceId) return
              removeDevice(activeDeviceId)
              router.replace("/connect")
            }}
            style={themed($actionBtn)}
          />
        </View>
      </Section>

      <SpotifySection />
    </Screen>
  )
}

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { themed } = useAppTheme()
  return (
    <Card mode="elevated" style={themed($card)}>
      <Card.Title title={title} titleStyle={themed($cardTitle)} />
      <Card.Content style={themed($cardContent)}>{children}</Card.Content>
    </Card>
  )
}

const SpotifySection: FC = () => {
  const { themed } = useAppTheme()
  const clientId = useSpotifyStore((s) => s.clientId)
  const tokens = useSpotifyStore((s) => s.tokens)
  const status = useSpotifyStore((s) => s.status)
  const error = useSpotifyStore((s) => s.error)
  const setClientId = useSpotifyStore((s) => s.setClientId)
  const connect = useSpotifyStore((s) => s.connect)
  const disconnect = useSpotifyStore((s) => s.disconnect)

  const [draftClientId, setDraftClientId] = useState(clientId)
  const redirectUri = getSpotifyRedirectUri()

  useEffect(() => {
    setDraftClientId(clientId)
  }, [clientId])

  return (
    <Section title="Spotify">
      <Text
        style={themed($helper)}
        text={`Create an app at developer.spotify.com/dashboard, paste its Client ID below, and add this Redirect URI in the app settings:\n${redirectUri}`}
      />

      <TextField
        value={draftClientId}
        onChangeText={setDraftClientId}
        onBlur={() => setClientId(draftClientId)}
        label="Client ID"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Row label="Status" value={spotifyStatusLabel(status, !!tokens)} />
      {!!error && <Text style={themed($error)} text={error} />}

      <View style={themed($actions)}>
        {tokens ? (
          <Button
            preset="reversed"
            text="Disconnect Spotify"
            onPress={disconnect}
            style={themed($actionBtn)}
          />
        ) : (
          <Button
            preset="filled"
            text={status === "authorizing" ? "Opening Spotify…" : "Connect Spotify"}
            disabled={!draftClientId.trim() || status === "authorizing"}
            onPress={() => {
              setClientId(draftClientId)
              connect()
            }}
            style={themed($actionBtn)}
          />
        )}
      </View>
    </Section>
  )
}

function spotifyStatusLabel(status: string, hasTokens: boolean): string {
  if (status === "authorizing") return "Authorizing…"
  if (status === "error") return "Error"
  if (hasTokens) return "Connected"
  return "Not connected"
}

const Row: FC<{ label: string; value: string }> = ({ label, value }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($row)}>
      <Text style={themed($rowLabel)} text={label} />
      <Text style={themed($rowValue)} text={value} numberOfLines={1} />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.md,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: spacing.sm,
})

const $cardTitle: ThemedStyle<TextStyle> = () => ({ fontWeight: "700" })

const $cardContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  paddingBottom: spacing.sm,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.sm,
})

const $rowLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })
const $rowValue: ThemedStyle<TextStyle> = () => ({ fontWeight: "600", flexShrink: 1, textAlign: "right" })
const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })
const $helper: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 12 })

const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginTop: spacing.xs,
})
const $actionBtn: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
