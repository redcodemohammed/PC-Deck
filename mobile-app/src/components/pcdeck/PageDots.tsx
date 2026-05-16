import { FC } from "react"
import { Pressable, View, ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated"
import { IconButton } from "react-native-paper"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface PageDotsProps {
  count: number
  current: number
  editable?: boolean
  canRemoveCurrent?: boolean
  onSelect: (page: number) => void
  onAdd?: () => void
  onRemove?: () => void
}

export const PageDots: FC<PageDotsProps> = ({
  count,
  current,
  editable,
  canRemoveCurrent,
  onSelect,
  onAdd,
  onRemove,
}) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($row)} pointerEvents="box-none">
      {Array.from({ length: count }).map((_, page) => (
        <PageDot key={page} active={page === current} onPress={() => onSelect(page)} />
      ))}
      {editable && (
        <IconButton
          icon="plus"
          mode="outlined"
          size={14}
          style={themed($iconBtn)}
          onPress={onAdd}
          accessibilityLabel="Add page"
        />
      )}
      {editable && canRemoveCurrent && (
        <IconButton
          icon="close"
          mode="outlined"
          size={14}
          style={themed($iconBtn)}
          onPress={onRemove}
          accessibilityLabel="Remove empty page"
        />
      )}
    </View>
  )
}

const PageDot: FC<{ active: boolean; onPress: () => void }> = ({ active, onPress }) => {
  const { themed, theme } = useAppTheme()
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 22 : 8, { duration: 180 }),
    height: 8,
    backgroundColor: withTiming(active ? theme.colors.tint : theme.colors.separator, {
      duration: 180,
    }),
  }))
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [themed($dotWrap), pressed && { opacity: 0.7 }]}
    >
      <Animated.View style={[themed($dot), style]} />
    </Pressable>
  )
}

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xs,
  paddingVertical: spacing.xs,
})

const $dotWrap: ThemedStyle<ViewStyle> = () => ({
  paddingVertical: 4,
  justifyContent: "center",
})

const $dot: ThemedStyle<ViewStyle> = () => ({
  borderRadius: 4,
})

const $iconBtn: ThemedStyle<ViewStyle> = () => ({
  width: 28,
  height: 28,
  margin: 0,
})
