import { FC, useState } from "react"
import { ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { Card, IconButton, Text as PaperText } from "react-native-paper"

import { Text } from "@/components/Text"
import type { ButtonKind, Deck } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { PRESETS, findPresetPlacement } from "./presets"

interface AddPanelProps {
  deck: Deck
  onAddKind: (kind: ButtonKind, row: number, column: number) => void
  onInsertPreset: (presetId: string) => Promise<void>
  onClose: () => void
}

const KINDS: { value: ButtonKind; label: string; icon: string; helper: string }[] = [
  { value: "button", icon: "▣", label: "Button", helper: "Tap to run one action" },
  { value: "toggle", icon: "⇄", label: "Toggle", helper: "Two-state switch" },
  { value: "slider", icon: "▭", label: "Slider", helper: "Volume / brightness" },
  { value: "widget", icon: "◆", label: "Widget", helper: "Live tile (clock, …)" },
]

export const AddPanel: FC<AddPanelProps> = ({ deck, onAddKind, onInsertPreset, onClose }) => {
  const { themed, theme } = useAppTheme()
  const [message, setMessage] = useState<string | null>(null)

  const handleKind = (kind: ButtonKind) => {
    const spot = findPresetPlacement(deck, 1, 1)
    if (!spot) {
      setMessage("No empty cell available. Resize the deck or delete something.")
      return
    }
    onAddKind(kind, spot.row, spot.column)
  }

  const handlePreset = async (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const placement = findPresetPlacement(deck, preset.width, preset.height)
    if (!placement) {
      setMessage(`No ${preset.width}×${preset.height} block free. Resize the deck.`)
      return
    }
    await onInsertPreset(presetId)
    setMessage(`Added "${preset.label}".`)
  }

  return (
    <View style={themed($panel)}>
      <View style={themed($header)}>
        <Text preset="subheading" text="Add to deck" />
        <IconButton icon="close" onPress={onClose} accessibilityLabel="Close add panel" size={20} />
      </View>

      <ScrollView contentContainerStyle={themed($scrollContent)}>
        <Text preset="formLabel" text="New tile" />
        <View style={themed($grid)}>
          {KINDS.map((k) => (
            <Card
              key={k.value}
              onPress={() => handleKind(k.value)}
              mode="outlined"
              style={themed($kindCard)}
            >
              <Card.Content style={themed($kindContent)}>
                <PaperText style={themed($kindIcon)}>{k.icon}</PaperText>
                <Text style={themed($kindLabel)} text={k.label} />
                <Text style={themed($kindHelper)} text={k.helper} />
              </Card.Content>
            </Card>
          ))}
        </View>

        <Text preset="formLabel" text="Presets" />
        <View style={themed($presetList)}>
          {PRESETS.map((p) => (
            <Card
              key={p.id}
              onPress={() => handlePreset(p.id)}
              mode="outlined"
              style={themed($presetCard)}
            >
              <Card.Content style={themed($presetContent)}>
                <View style={themed($presetInfo)}>
                  <Text style={themed($presetLabel)} text={p.label} />
                  <Text style={themed($presetDesc)} text={p.description} />
                </View>
                <Text style={themed($presetSize)} text={`${p.height}×${p.width}`} />
              </Card.Content>
            </Card>
          ))}
        </View>

        {!!message && (
          <Text style={[themed($message), { color: theme.colors.tint }]} text={message} />
        )}
      </ScrollView>
    </View>
  )
}

const $panel: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 280,
  borderLeftWidth: 1,
  borderLeftColor: colors.border,
  backgroundColor: colors.background,
  paddingHorizontal: spacing.sm,
  paddingTop: spacing.sm,
})
const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.sm,
})
const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm, paddingBottom: spacing.lg })
const $grid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $kindCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexBasis: "48%",
  flexGrow: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
})
const $kindContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs, padding: spacing.sm })
const $kindIcon: ThemedStyle<TextStyle> = ({ colors }) => ({ fontSize: 20, color: colors.tint })
const $kindLabel: ThemedStyle<TextStyle> = () => ({ fontWeight: "700" })
const $kindHelper: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })

const $presetList: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $presetCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderColor: colors.border,
  borderRadius: spacing.xs,
})
const $presetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  padding: spacing.sm,
})
const $presetInfo: ThemedStyle<ViewStyle> = () => ({ flex: 1, gap: 2 })
const $presetLabel: ThemedStyle<TextStyle> = () => ({ fontWeight: "700" })
const $presetDesc: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
const $presetSize: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "700",
  fontSize: 12,
})
const $message: ThemedStyle<TextStyle> = () => ({ fontSize: 12, fontWeight: "600" })
