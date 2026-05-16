import { FC } from "react"
import { ViewStyle } from "react-native"
import { IconButton, Surface } from "react-native-paper"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface EmptySlotProps {
  width: number
  height: number
  onPress?: () => void
}

export const EmptySlot: FC<EmptySlotProps> = ({ width, height, onPress }) => {
  const { themed } = useAppTheme()
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
