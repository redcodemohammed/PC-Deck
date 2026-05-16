import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Text } from "react-native-paper"

import type { WsStatus } from "@/services/pcdeck"
import type { ConnectionStatus as PairingStatus } from "@/stores/connectionStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ConnectionStatusProps {
  pairing: PairingStatus
  socket: WsStatus
  desktopName?: string
  host?: string
}

function labelFor(pairing: PairingStatus, socket: WsStatus): string {
  if (pairing === "pairing") return "Pairing..."
  if (pairing === "error") return "Pairing failed"
  if (pairing !== "connected") return "Not connected"
  switch (socket) {
    case "open":
      return "Connected"
    case "connecting":
      return "Reconnecting..."
    case "closed":
      return "Disconnected"
    case "error":
      return "Connection error"
    default:
      return "Paired"
  }
}

function colorKey(pairing: PairingStatus, socket: WsStatus): "ok" | "warn" | "err" {
  if (pairing === "error") return "err"
  if (pairing === "connected" && socket === "open") return "ok"
  if (pairing === "connected") return "warn"
  if (pairing === "pairing") return "warn"
  return "warn"
}

export const ConnectionStatus: FC<ConnectionStatusProps> = ({
  pairing,
  socket,
  desktopName,
  host,
}) => {
  const { themed, theme } = useAppTheme()
  const tone = colorKey(pairing, socket)
  const dotColor =
    tone === "ok"
      ? theme.colors.palette.accent400
      : tone === "err"
        ? theme.colors.error
        : theme.colors.palette.secondary300

  const label = labelFor(pairing, socket)
  const detail = desktopName ? `${desktopName}${host ? ` · ${host}` : ""}` : host

  return (
    <View style={themed($row)}>
      <View style={[themed($dot), { backgroundColor: dotColor }]} />
      <Text variant="labelLarge" style={themed($label)}>
        {label}
      </Text>
      {!!detail && (
        <Text
          variant="bodySmall"
          style={[themed($detail), { color: theme.colors.textDim }]}
          numberOfLines={1}
        >
          {detail}
        </Text>
      )}
    </View>
  )
}

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  flexShrink: 1,
  minHeight: 24,
})

const $dot: ThemedStyle<ViewStyle> = () => ({
  width: 10,
  height: 10,
  borderRadius: 5,
})

const $label: ThemedStyle<TextStyle> = () => ({
  lineHeight: 20,
})

const $detail: ThemedStyle<TextStyle> = () => ({
  lineHeight: 20,
  flexShrink: 1,
})
