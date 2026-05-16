import { FC, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"
import { Card } from "react-native-paper"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { type SavedDevice, useConnectionStore } from "@/stores/connectionStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const DevicesScreen: FC = function DevicesScreen() {
  const { themed } = useAppTheme()
  const router = useRouter()

  const devices = useConnectionStore((s) => s.devices)
  const activeDeviceId = useConnectionStore((s) => s.activeDeviceId)
  const setActiveDevice = useConnectionStore((s) => s.setActiveDevice)
  const removeDevice = useConnectionStore((s) => s.removeDevice)
  const renameDevice = useConnectionStore((s) => s.renameDevice)

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($headerRow)}>
        <Text preset="heading" text="Devices" />
        <Button preset="filled" text="+ Pair another" onPress={() => router.push("/connect")} />
      </View>

      {devices.length === 0 ? (
        <Text style={themed($empty)} text="No paired desktops yet." />
      ) : (
        devices.map((d) => (
          <DeviceCard
            key={d.id}
            device={d}
            active={d.id === activeDeviceId}
            onOpen={() => {
              setActiveDevice(d.id)
              router.replace("/deck")
            }}
            onRename={(name) => renameDevice(d.id, name)}
            onRemove={() => removeDevice(d.id)}
          />
        ))
      )}
    </Screen>
  )
}

interface DeviceCardProps {
  device: SavedDevice
  active: boolean
  onOpen: () => void
  onRename: (name: string) => void
  onRemove: () => void
}

const DeviceCard: FC<DeviceCardProps> = ({ device, active, onOpen, onRename, onRemove }) => {
  const { themed, theme } = useAppTheme()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(device.deviceName)
  const [confirm, setConfirm] = useState(false)

  const commitRename = () => {
    onRename(draft.trim() || device.deviceName)
    setEditing(false)
  }

  const activeOverlay: ViewStyle = { borderColor: theme.colors.tint, borderWidth: 2 }
  return (
    <Card mode="elevated" style={[themed($card), active && activeOverlay]}>
      <Card.Content style={themed($cardInner)}>
      <View style={themed($cardHeader)}>
        <View style={themed($cardInfo)}>
          <Text style={themed($name)} text={device.desktopName || device.host} />
          <Text style={themed($meta)} text={`${device.host} · paired as "${device.deviceName}"`} />
          <Text
            style={themed($meta)}
            text={`Paired ${new Date(device.pairedAt).toLocaleString()}`}
          />
        </View>
        {active && <Text style={themed($activeTag)} text="ACTIVE" />}
      </View>

      {editing ? (
        <View style={themed($renameRow)}>
          <TextField
            value={draft}
            onChangeText={setDraft}
            label="Device name"
            placeholder="Tablet"
            containerStyle={themed($renameField)}
          />
          <View style={themed($renameActions)}>
            <Button preset="filled" text="Save" onPress={commitRename} />
            <Pressable
              onPress={() => {
                setDraft(device.deviceName)
                setEditing(false)
              }}
            >
              <Text style={themed($cancel)} text="Cancel" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={themed($actions)}>
          {!active && (
            <Button preset="filled" text="Open" onPress={onOpen} style={themed($actionBtn)} />
          )}
          <Button
            preset="default"
            text="Rename"
            onPress={() => setEditing(true)}
            style={themed($actionBtn)}
          />
          <Button
            preset="reversed"
            text={confirm ? "Confirm remove" : "Remove"}
            onPress={() => {
              if (confirm) onRemove()
              else setConfirm(true)
            }}
            style={themed($actionBtn)}
          />
        </View>
      )}
      </Card.Content>
    </Card>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.md,
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.sm,
})

const $empty: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  padding: spacing.md,
  textAlign: "center",
})

const $card: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: spacing.sm,
})

const $cardInner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
})

const $cardHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
})

const $cardInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs, flexShrink: 1 })

const $name: ThemedStyle<TextStyle> = () => ({ fontWeight: "700", fontSize: 16 })

const $meta: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 12 })

const $activeTag: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "700",
  fontSize: 11,
})

const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})
const $actionBtn: ThemedStyle<ViewStyle> = () => ({ flex: 1 })

const $renameRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $renameField: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
const $renameActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})
const $cancel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })
