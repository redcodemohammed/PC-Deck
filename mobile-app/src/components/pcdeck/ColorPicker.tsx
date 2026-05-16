import { FC } from "react"
import { Pressable, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ColorPickerProps {
  value: string | null | undefined
  onChange: (color: string | null) => void
}

export const COLOR_OPTIONS: string[] = [
  "#7C3AED", // violet
  "#2563EB", // blue
  "#0EA5E9", // sky
  "#10B981", // emerald
  "#84CC16", // lime
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#A855F7", // purple
  "#14B8A6", // teal
  "#3F3F46", // zinc
  "#1F2937", // slate
]

export const ColorPicker: FC<ColorPickerProps> = ({ value, onChange }) => {
  const { themed, theme } = useAppTheme()
  return (
    <View style={themed($container)}>
      <View style={themed($row)}>
        <Pressable
          onPress={() => onChange(null)}
          style={({ pressed }) => [
            themed($swatch),
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            !value && { borderColor: theme.colors.tint, borderWidth: 2 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text text="—" />
        </Pressable>
        {COLOR_OPTIONS.map((color) => {
          const active = value?.toLowerCase() === color.toLowerCase()
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              style={({ pressed }) => [
                themed($swatch),
                { backgroundColor: color },
                active && { borderColor: theme.colors.text, borderWidth: 3 },
                pressed && { opacity: 0.85 },
              ]}
            />
          )
        })}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $swatch: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 44,
  height: 44,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
})
