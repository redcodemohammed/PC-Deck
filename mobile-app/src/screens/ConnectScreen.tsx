import { FC, useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"
import { Card } from "react-native-paper"

import { Button } from "@/components/Button"
import { ConnectionStatus } from "@/components/pcdeck"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { localSubnet, scanForDaemons, type ScanResult } from "@/services/pcdeck"
import { useConnectionStore } from "@/stores/connectionStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const ConnectScreen: FC = function ConnectScreen() {
  const { themed, theme } = useAppTheme()
  const router = useRouter()

  const status = useConnectionStore((s) => s.status)
  const error = useConnectionStore((s) => s.error)
  const devices = useConnectionStore((s) => s.devices)
  const pair = useConnectionStore((s) => s.pair)
  const setActiveDevice = useConnectionStore((s) => s.setActiveDevice)

  const lastDeviceName = devices[devices.length - 1]?.deviceName ?? "Tablet"

  const [host, setHost] = useState("")
  const [deviceName, setDeviceName] = useState(lastDeviceName)
  const [pairingCode, setPairingCode] = useState("")
  const [subnet, setSubnet] = useState<string | null>(null)

  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  useEffect(() => {
    localSubnet().then(setSubnet)
  }, [])

  const submitting = status === "pairing"
  const canSubmit = host.trim().length > 0 && pairingCode.trim().length > 0 && !submitting

  const onSubmit = async () => {
    try {
      await pair(host.trim(), pairingCode.trim(), deviceName.trim())
      router.replace("/deck")
    } catch {
      // surfaced via store
    }
  }

  const onScan = useCallback(async () => {
    if (scanning) return
    setScanResults([])
    setScanProgress(0)
    setScanning(true)
    try {
      const results = await scanForDaemons({
        onFound: (r) => setScanResults((prev) => [...prev, r]),
        onProgress: setScanProgress,
      })
      setScanResults(results)
    } finally {
      setScanning(false)
    }
  }, [scanning])

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($content)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($header)}>
        <Text preset="heading" text="PC Deck" />
        <Text preset="subheading" text="Pair this tablet with a desktop on your LAN" />
      </View>

      {devices.length > 0 && (
        <Card mode="elevated" style={themed($card)}>
          <Card.Title
            title="Saved devices"
            titleStyle={themed($cardTitle)}
            right={() => (
              <Pressable onPress={() => router.push("/devices")} style={themed($manageBtn)}>
                <Text style={themed($link)} text="Manage" />
              </Pressable>
            )}
          />
          <Card.Content style={themed($cardContent)}>
            {devices.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => {
                  setActiveDevice(d.id)
                  router.replace("/deck")
                }}
                style={({ pressed }) => [themed($deviceRow), pressed && { opacity: 0.85 }]}
              >
                <View style={themed($deviceInfo)}>
                  <Text style={themed($deviceName)} text={d.desktopName || d.host} />
                  <Text style={themed($deviceMeta)} text={`${d.host} · ${d.deviceName}`} />
                </View>
                <Text style={themed($link)} text="Open ›" />
              </Pressable>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card mode="elevated" style={themed($card)}>
        <Card.Title
          title="Find on network"
          titleStyle={themed($cardTitle)}
          right={() => (
            <Button
              preset="default"
              text={scanning ? `${Math.round(scanProgress * 100)}%` : "Scan"}
              onPress={onScan}
              disabled={scanning}
              style={themed($manageBtn)}
            />
          )}
        />
        <Card.Content style={themed($cardContent)}>
          {!!subnet && (
            <Text
              style={themed($helper)}
              text={`Probing ${subnet}.1 – ${subnet}.254 on port 41730`}
            />
          )}
          {scanning && scanResults.length === 0 && (
            <ActivityIndicator color={theme.colors.tint} />
          )}
          {scanResults.map((r) => (
            <Pressable
              key={r.host}
              onPress={() => setHost(r.host)}
              style={({ pressed }) => [themed($deviceRow), pressed && { opacity: 0.85 }]}
            >
              <View style={themed($deviceInfo)}>
                <Text style={themed($deviceName)} text={r.health.name} />
                <Text style={themed($deviceMeta)} text={`${r.host} · ${r.health.platform}`} />
              </View>
              <Text style={themed($link)} text="Use ›" />
            </Pressable>
          ))}
        </Card.Content>
      </Card>

      <Card mode="elevated" style={themed($card)}>
        <Card.Title title="Pair a new desktop" titleStyle={themed($cardTitle)} />
        <Card.Content style={themed($cardContent)}>
        <TextField
          value={host}
          onChangeText={setHost}
          label="Desktop IP or hostname"
          placeholder={subnet ? `${subnet}.42` : "192.168.1.42"}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="url"
        />
        <TextField
          value={pairingCode}
          onChangeText={(v) => setPairingCode(v.replace(/[^0-9]/g, "").slice(0, 6))}
          label="Pairing code"
          placeholder="6-digit code from daemon logs"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          value={deviceName}
          onChangeText={setDeviceName}
          label="Device name"
          placeholder="Tablet"
        />

        {!!error && status === "error" && <Text style={themed($error)} text={error} />}

        <Button
          text={submitting ? "Pairing…" : "Pair"}
          preset="filled"
          onPress={onSubmit}
          disabled={!canSubmit}
        />

        <ConnectionStatus pairing={status} socket="idle" host={host} />
        </Card.Content>
      </Card>
    </Screen>
  )
}

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })

const $card: ThemedStyle<ViewStyle> = ({ spacing }) => ({ borderRadius: spacing.sm })
const $cardTitle: ThemedStyle<TextStyle> = () => ({ fontWeight: "700" })
const $cardContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  paddingBottom: spacing.sm,
})
const $manageBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
})

const $deviceRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: spacing.sm,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})

const $deviceInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs, flexShrink: 1 })
const $deviceName: ThemedStyle<TextStyle> = () => ({ fontWeight: "600" })
const $deviceMeta: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})
const $link: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.tint, fontWeight: "600" })
const $helper: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 12 })
const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })
