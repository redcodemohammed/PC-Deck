import { FC } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import type { HotkeyConfig, HotkeyModifier } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface HotkeyRecorderProps {
  value: HotkeyConfig | null
  onChange: (next: HotkeyConfig) => void
}

const MODIFIERS: { id: HotkeyModifier; label: string }[] = [
  { id: "ctrl", label: "Ctrl" },
  { id: "shift", label: "Shift" },
  { id: "alt", label: "Alt" },
  { id: "meta", label: "⌘ / Win" },
]

const KEYS: string[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "Enter",
  "Esc",
  "Tab",
  "Space",
  "Backspace",
  "Delete",
  "Up",
  "Down",
  "Left",
  "Right",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]

export function describeHotkey(value: HotkeyConfig | null): string {
  if (!value || !value.key) return "Not set"
  const order: HotkeyModifier[] = ["ctrl", "shift", "alt", "meta"]
  const mods = order.filter((m) => value.modifiers.includes(m))
  const modLabels = mods.map((m) => MODIFIERS.find((x) => x.id === m)!.label)
  return [...modLabels, value.key].join(" + ")
}

export const HotkeyRecorder: FC<HotkeyRecorderProps> = ({ value, onChange }) => {
  const { themed, theme } = useAppTheme()
  const current: HotkeyConfig = value ?? { modifiers: [], key: "" }

  const toggleMod = (m: HotkeyModifier) => {
    const has = current.modifiers.includes(m)
    const modifiers = has ? current.modifiers.filter((x) => x !== m) : [...current.modifiers, m]
    onChange({ ...current, modifiers })
  }

  const pickKey = (k: string) => onChange({ ...current, key: k })

  return (
    <View style={themed($container)}>
      <Text preset="formLabel" text="Modifiers" />
      <View style={themed($row)}>
        {MODIFIERS.map((m) => {
          const active = current.modifiers.includes(m.id)
          return (
            <Pressable
              key={m.id}
              onPress={() => toggleMod(m.id)}
              style={({ pressed }) => [
                themed($chip),
                active && { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[themed($chipText), active && { color: theme.colors.palette.neutral100 }]}
                text={m.label}
              />
            </Pressable>
          )
        })}
      </View>
      <Text preset="formLabel" text="Key" />
      <View style={themed($keyGrid)}>
        {KEYS.map((k) => {
          const active = current.key === k
          return (
            <Pressable
              key={k}
              onPress={() => pickKey(k)}
              style={({ pressed }) => [
                themed($keyChip),
                active && { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[themed($chipText), active && { color: theme.colors.palette.neutral100 }]}
                text={k}
              />
            </Pressable>
          )
        })}
      </View>
      <Text preset="formHelper" text={`Selected: ${describeHotkey(current)}`} />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $keyGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xxs,
})
const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})
const $keyChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: spacing.xxs,
  borderWidth: 1,
  borderColor: colors.border,
  minWidth: 44,
  alignItems: "center",
})
const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.text })
