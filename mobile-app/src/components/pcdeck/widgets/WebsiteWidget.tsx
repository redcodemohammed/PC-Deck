import { FC, useMemo } from "react"
import { Image, Linking, Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import type { WebsiteWidgetConfig } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface WebsiteWidgetProps {
  config: WebsiteWidgetConfig
  width: number
  height: number
}

function hostnameOf(rawUrl: string): string | null {
  if (!rawUrl) return null
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`)
    return u.hostname
  } catch {
    return null
  }
}

export const WebsiteWidget: FC<WebsiteWidgetProps> = ({ config, width, height }) => {
  const { themed } = useAppTheme()
  const host = useMemo(() => hostnameOf(config.url), [config.url])
  const faviconUri = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : null
  const title = config.title || host || "Website"

  const open = () => {
    if (!config.url) return
    const target = config.url.startsWith("http") ? config.url : `https://${config.url}`
    Linking.openURL(target).catch(() => {})
  }

  const compact = width < 120 || height < 120

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [themed($container), pressed && { opacity: 0.85 }]}
    >
      {!!faviconUri && (
        <Image source={{ uri: faviconUri }} style={compact ? $iconSm : $iconLg} />
      )}
      <Text
        style={themed(compact ? $titleSm : $titleLg)}
        text={title}
        numberOfLines={2}
      />
      {!compact && !!host && <Text style={themed($host)} text={host} />}
    </Pressable>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xs,
  gap: spacing.xxs,
})
const $iconSm = { width: 24, height: 24 }
const $iconLg = { width: 40, height: 40 }
const $titleSm: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "600",
  textAlign: "center",
  fontSize: 12,
})
const $titleLg: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "700",
  textAlign: "center",
  fontSize: 14,
})
const $host: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.7,
  fontSize: 11,
})
