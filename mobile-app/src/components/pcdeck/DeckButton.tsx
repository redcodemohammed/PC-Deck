import { FC, useEffect, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import Slider from "@react-native-community/slider"
import { Surface, Switch, Text } from "react-native-paper"

import type { DeckButton as DeckButtonModel } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { WidgetTile } from "./widgets/WidgetTile"

interface DeckButtonProps {
  button: DeckButtonModel
  width: number
  height: number
  toggleState?: boolean
  sliderValue?: number
  onPress?: () => void
  onLongPress?: () => void
  onToggle?: (next: boolean) => void
  onSlide?: (value: number) => void
  disabled?: boolean
}

export const DeckButton: FC<DeckButtonProps> = ({
  button,
  width,
  height,
  toggleState,
  sliderValue,
  onPress,
  onLongPress,
  onToggle,
  onSlide,
  disabled,
}) => {
  const { themed, theme } = useAppTheme()
  const kind = button.kind ?? "button"

  if (kind === "widget") {
    return (
      <Pressable
        onLongPress={onLongPress}
        disabled={disabled}
        style={[
          themed($widgetTile),
          {
            width,
            height,
            backgroundColor: button.color ?? theme.colors.palette.secondary500,
          },
        ]}
      >
        <WidgetTile widget={button.widget} width={width} height={height} />
      </Pressable>
    )
  }

  if (kind === "slider") {
    return (
      <Surface
        elevation={1}
        style={[
          themed($tile),
          {
            width,
            height,
            backgroundColor: button.color ?? theme.colors.palette.secondary100,
            padding: theme.spacing.xs,
          },
        ]}
      >
        <View style={$labelRow}>
          {!!button.icon && <Text style={themed($iconSm)}>{button.icon}</Text>}
          <Text style={themed($label)} numberOfLines={1}>
            {button.label}
          </Text>
        </View>
        <SliderControl button={button} value={sliderValue} onChange={onSlide} width={width - theme.spacing.xs * 2} />
        <Text style={themed($slideValue)}>{String(Math.round(sliderValue ?? button.slider?.initial ?? 0))}</Text>
      </Surface>
    )
  }

  if (kind === "toggle") {
    const on = toggleState ?? !!button.toggle?.state
    const t = button.toggle
    const icon = on ? (t?.onIcon ?? button.icon) : (t?.offIcon ?? button.icon)
    const label = on ? (t?.onLabel ?? button.label) : (t?.offLabel ?? button.label)
    const color = on
      ? (t?.onColor ?? button.color ?? theme.colors.palette.accent400)
      : (t?.offColor ?? theme.colors.palette.neutral400)
    return (
      <Pressable
        onPress={() => onToggle?.(!on)}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed }) => [
          themed($tile),
          { width, height, backgroundColor: color },
          pressed && themed($pressed),
        ]}
      >
        <View style={$content}>
          {!!icon && <Text style={themed($icon)}>{icon}</Text>}
          <Text style={themed($label)} numberOfLines={2} ellipsizeMode="tail">
            {label}
          </Text>
          <View style={themed($switchRow)}>
            <Switch value={on} onValueChange={(next) => onToggle?.(next)} disabled={disabled} />
            <Text style={themed($state)}>{on ? "ON" : "OFF"}</Text>
          </View>
        </View>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={({ pressed }) => [
        themed($tile),
        {
          width,
          height,
          backgroundColor: button.color ?? theme.colors.palette.secondary100,
        },
        pressed && themed($pressed),
      ]}
    >
      <View style={$content}>
        {!!button.icon && <Text style={themed($icon)}>{button.icon}</Text>}
        <Text style={themed($label)} numberOfLines={2} ellipsizeMode="tail">
          {button.label}
        </Text>
      </View>
    </Pressable>
  )
}

const SliderControl: FC<{
  button: DeckButtonModel
  value?: number
  width: number
  onChange?: (value: number) => void
}> = ({ button, value, onChange, width }) => {
  const { theme } = useAppTheme()
  const cfg = button.slider ?? { min: 0, max: 100, step: 1, initial: 50, bind: "custom" as const }
  const [local, setLocal] = useState(value ?? cfg.initial)
  // Keep local in sync if parent updates (e.g. ws-driven state).
  useEffect(() => {
    if (typeof value === "number") setLocal(value)
  }, [value])
  const sliderStyle: ViewStyle = { width, height: 32 }
  return (
    <Slider
      style={sliderStyle}
      minimumValue={cfg.min}
      maximumValue={cfg.max}
      step={cfg.step}
      value={local}
      onValueChange={setLocal}
      onSlidingComplete={(v) => onChange?.(v)}
      minimumTrackTintColor={theme.colors.palette.neutral100}
      maximumTrackTintColor={theme.colors.palette.neutral400}
      thumbTintColor={theme.colors.palette.neutral100}
    />
  )
}

const $tile: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: spacing.sm,
  padding: spacing.xs,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
})

const $widgetTile: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: spacing.sm,
  overflow: "hidden",
})

const $pressed: ThemedStyle<ViewStyle> = () => ({ opacity: 0.7 })

const $content: ViewStyle = { alignItems: "center", justifyContent: "center" }
const $labelRow: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 6 }

const $icon: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 28,
  marginBottom: spacing.xxs,
})

const $iconSm: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
})

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "600",
  textAlign: "center",
})

const $state: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.neutral100,
  fontSize: 11,
  fontWeight: "700",
})

const $switchRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  marginTop: spacing.xxs,
})

const $slideValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "600",
  fontSize: 12,
})
