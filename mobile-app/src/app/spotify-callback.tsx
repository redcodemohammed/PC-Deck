import { useEffect } from "react"
import { ActivityIndicator, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

/**
 * Fallback for the Spotify OAuth redirect. The OAuth flow normally captures the
 * redirect inside `WebBrowser.openAuthSessionAsync` and never deep-links into
 * the app. This route only fires if interception fails (e.g. the user manually
 * dismisses the auth tab), in which case we just send them back to the previous
 * screen — Spotify's redirect URL also carries the `code` query param, which
 * the in-flight auth promise will have already consumed.
 */
export default function SpotifyCallbackRoute() {
  const { themed, theme } = useAppTheme()
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => {
      if (router.canGoBack()) router.back()
      else router.replace("/settings")
    }, 50)
    return () => clearTimeout(t)
  }, [router])

  return (
    <View style={themed($container)}>
      <ActivityIndicator color={theme.colors.tint} />
      <Text text="Returning to PC Deck…" />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
})
