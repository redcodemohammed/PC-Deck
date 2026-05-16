import { FC } from "react"
import { View, ViewStyle } from "react-native"
import { IconButton, Surface } from "react-native-paper"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface EmptySlotProps {
  width: number
  height: number
  /** When true the slot shows a "+" affordance and reacts to press. */
  editable?: boolean
  onPress?: () => void
}

export const EmptySlot: FC<EmptySlotProps> = ({ width, height, editable, onPress }) => {
  const { themed } = useAppTheme()

  if (!editable) {
    return <View style={[themed($slotIdle), { width, height }]} />
  }

  return (
    <Surface elevation={0} style={[themed($slot), { width, height }]}>
      <IconButton icon="plus" mode="outlined" onPress={onPress} accessibilityLabel="Add button" />
    </Surface>
  )
}

const $slot: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: spacing.sm,
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
})

const $slotIdle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: spacing.sm,
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: colors.separator,
  opacity: 0.4,
})
