import { FC } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export const ICON_OPTIONS: string[] = [
  "▶️",
  "⏸️",
  "⏹️",
  "⏭️",
  "⏮️",
  "🔊",
  "🔇",
  "🎵",
  "🎙️",
  "🎬",
  "🎮",
  "🎯",
  "🚀",
  "💻",
  "🖥️",
  "🖱️",
  "⌨️",
  "💾",
  "📁",
  "📂",
  "📷",
  "🖼️",
  "🎨",
  "✏️",
  "📝",
  "📋",
  "🔍",
  "🔒",
  "🔓",
  "⚙️",
  "🌐",
  "📧",
  "💬",
  "📞",
  "📅",
  "⏰",
  "🌙",
  "☀️",
  "🔥",
  "⭐",
  "📈",
  "📉",
  "📊",
  "💡",
  "🔔",
  "✅",
  "❌",
  "➕",
  "➖",
  "🔄",
]

export const IconPicker: FC<IconPickerProps> = ({ value, onChange }) => {
  const { themed, theme } = useAppTheme()
  return (
    <View style={themed($container)}>
      <View style={themed($grid)}>
        <Pressable
          onPress={() => onChange("")}
          style={({ pressed }) => [
            themed($cell),
            !value && { borderColor: theme.colors.tint, borderWidth: 2 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={themed($none)} text="None" />
        </Pressable>
        {ICON_OPTIONS.map((icon) => {
          const active = icon === value
          return (
            <Pressable
              key={icon}
              onPress={() => onChange(icon)}
              style={({ pressed }) => [
                themed($cell),
                active && { borderColor: theme.colors.tint, borderWidth: 2 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={themed($emoji)} text={icon} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $grid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xxs,
})
const $cell: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 44,
  height: 44,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
})
const $emoji: ThemedStyle<TextStyle> = () => ({ fontSize: 22 })
const $none: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
