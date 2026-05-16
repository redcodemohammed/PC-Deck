import { FC, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { DeckIcon } from "./DeckIcon"

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export const EMOJI_ICON_OPTIONS: string[] = [
  "🎵","🎙️","🎬","🎮","🎯","🚀","💻","🖥️","🎨","📷",
  "📁","📂","📝","📋","🔍","🔒","🔓","⚙️","🌐","📧",
  "💬","📞","📅","⏰","🌙","☀️","🔥","⭐","📈","📉",
  "📊","💡","🔔","✅","❌","➕","➖","🔄","❤️","💎",
]

/** Material Community Icon names, stored as `mdi:<name>` so DeckIcon renders them. */
export const MATERIAL_ICON_OPTIONS: string[] = [
  "mdi:play","mdi:pause","mdi:stop","mdi:skip-next","mdi:skip-previous",
  "mdi:fast-forward","mdi:rewind","mdi:shuffle","mdi:repeat","mdi:record",
  "mdi:volume-high","mdi:volume-medium","mdi:volume-low","mdi:volume-off","mdi:volume-mute",
  "mdi:microphone","mdi:microphone-off","mdi:headphones","mdi:speaker","mdi:music",
  "mdi:video","mdi:video-off","mdi:camera","mdi:image","mdi:movie-open",
  "mdi:monitor","mdi:laptop","mdi:keyboard","mdi:mouse","mdi:gamepad-variant",
  "mdi:web","mdi:home","mdi:cog","mdi:account","mdi:magnify",
  "mdi:lock","mdi:lock-open","mdi:eye","mdi:eye-off","mdi:bell",
  "mdi:email","mdi:message","mdi:phone","mdi:calendar","mdi:clock-outline",
  "mdi:folder","mdi:file","mdi:download","mdi:upload","mdi:cloud",
  "mdi:plus","mdi:minus","mdi:check","mdi:close","mdi:refresh",
  "mdi:power","mdi:lightbulb","mdi:wifi","mdi:bluetooth","mdi:battery",
  "mdi:heart","mdi:star","mdi:thumb-up","mdi:flag","mdi:rocket-launch",
]

type Tab = "material" | "emoji"

export const IconPicker: FC<IconPickerProps> = ({ value, onChange }) => {
  const { themed, theme } = useAppTheme()
  const [tab, setTab] = useState<Tab>(value.startsWith("mdi:") || !value ? "material" : "emoji")

  const options = tab === "material" ? MATERIAL_ICON_OPTIONS : EMOJI_ICON_OPTIONS

  return (
    <View style={themed($container)}>
      <View style={themed($tabs)}>
        {(["material", "emoji"] as const).map((t) => {
          const active = tab === t
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={({ pressed }) => [
                themed($tab),
                active && { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[themed($tabText), active && { color: theme.colors.palette.neutral100 }]}
                text={t === "material" ? "Icons" : "Emoji"}
              />
            </Pressable>
          )
        })}
      </View>

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
        {options.map((icon) => {
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
              <DeckIcon name={icon} size={22} color={theme.colors.text} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $tabs: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})
const $tab: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})
const $tabText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.text, fontWeight: "600" })
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
const $none: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
