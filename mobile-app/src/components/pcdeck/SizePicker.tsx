import { FC } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { Chip } from "react-native-paper"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface SizePickerProps {
  rows: number
  columns: number
  maxRows: number
  maxColumns: number
  onChange: (rows: number, columns: number) => void
}

interface SizePreset {
  label: string
  rows: number
  columns: number
}

const PRESETS: SizePreset[] = [
  { label: "Mini · 2×3", rows: 2, columns: 3 },
  { label: "Standard · 3×5", rows: 3, columns: 5 },
  { label: "Plus · 4×8", rows: 4, columns: 8 },
  { label: "XL · 5×10", rows: 5, columns: 10 },
]

const CELL = 22
const GAP = 4

export const SizePicker: FC<SizePickerProps> = ({
  rows,
  columns,
  maxRows,
  maxColumns,
  onChange,
}) => {
  const { themed, theme } = useAppTheme()

  return (
    <View style={themed($container)}>
      <View style={themed($presetRow)}>
        {PRESETS.filter((p) => p.rows <= maxRows && p.columns <= maxColumns).map((p) => {
          const active = p.rows === rows && p.columns === columns
          return (
            <Chip
              key={p.label}
              mode={active ? "flat" : "outlined"}
              selected={active}
              onPress={() => onChange(p.rows, p.columns)}
              style={themed($preset)}
              textStyle={themed($presetText)}
            >
              {p.label}
            </Chip>
          )
        })}
      </View>

      <Text style={themed($helper)} text="Or tap to set: highlights the bottom-right cell of your grid." />

      <View style={themed($grid)}>
        {Array.from({ length: maxRows }).map((_, r) => (
          <View key={r} style={themed($gridRow)}>
            {Array.from({ length: maxColumns }).map((_, c) => {
              const inside = r < rows && c < columns
              return (
                <Pressable
                  key={c}
                  onPress={() => onChange(r + 1, c + 1)}
                  style={({ pressed }) => [
                    themed($cell),
                    {
                      width: CELL,
                      height: CELL,
                      marginRight: c < maxColumns - 1 ? GAP : 0,
                    },
                    inside && { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint },
                    pressed && { opacity: 0.7 },
                  ]}
                />
              )
            })}
          </View>
        ))}
      </View>

      <Text style={themed($size)} text={`${rows} × ${columns}`} />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })
const $presetRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $preset: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})
const $presetText: ThemedStyle<TextStyle> = () => ({ fontWeight: "600" })
const $helper: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
const $grid: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: GAP, marginTop: spacing.xs })
const $gridRow: ThemedStyle<ViewStyle> = () => ({ flexDirection: "row" })
const $cell: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: spacing.xxs,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
})
const $size: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontWeight: "700" })
