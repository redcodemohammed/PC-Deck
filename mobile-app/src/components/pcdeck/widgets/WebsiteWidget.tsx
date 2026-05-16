import { FC, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Linking,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { Icon, IconButton, Text as PaperText } from "react-native-paper"
import { WebView } from "react-native-webview"

import type { WebsiteWidgetConfig } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface WebsiteWidgetProps {
  config: WebsiteWidgetConfig
  width: number
  height: number
}

function normalizeUrl(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export const WebsiteWidget: FC<WebsiteWidgetProps> = ({ config, width, height }) => {
  const { themed, theme } = useAppTheme()
  const url = useMemo(() => normalizeUrl(config.url), [config.url])
  const host = url ? hostnameOf(url) : null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!url) {
    return (
      <View style={themed($empty)}>
        <Icon source="link-off" size={24} color={theme.colors.palette.neutral100} />
        <PaperText style={themed($emptyText)}>Set a URL in the widget config</PaperText>
      </View>
    )
  }

  // Initial fit-to-tile scale; the user can pinch-zoom from there.
  const initialScale = Math.max(0.25, Math.min(1, width / 1024))
  const injectedJsBefore = `
    (function () {
      var meta = document.querySelector('meta[name=viewport]')
        || document.head.appendChild(document.createElement('meta'))
      meta.name = 'viewport'
      meta.setAttribute('content', 'width=1024, initial-scale=${initialScale.toFixed(3)}, minimum-scale=0.1, maximum-scale=4, user-scalable=yes')
    })()
    true;
  `

  return (
    <View style={themed($container)}>
      <View style={themed($webViewWrap)}>
        <WebView
          source={{ uri: url }}
          style={[themed($webView), { width, height }]}
          containerStyle={themed($webView)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          allowsInlineMediaPlayback
          injectedJavaScriptBeforeContentLoaded={injectedJsBefore}
          onLoadStart={() => {
            setLoading(true)
            setError(null)
          }}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            setLoading(false)
            setError(e.nativeEvent.description || "Failed to load")
          }}
          // Pinch / scroll / Android built-in zoom controls — pan-zoom works
          // naturally; the parent Appbar's "Edit" toggle is still the way to
          // enter edit mode for the deck.
          scrollEnabled
          scalesPageToFit
          setBuiltInZoomControls
          setDisplayZoomControls={false}
          minimumZoomScale={0.5}
          maximumZoomScale={5}
        />
      </View>

      {loading && (
        <View style={themed($loadingOverlay)}>
          <ActivityIndicator color={theme.colors.tint} />
        </View>
      )}

      {!!error && !loading && (
        <View style={themed($errorOverlay)}>
          <PaperText style={themed($errorText)}>{error}</PaperText>
          {!!host && <PaperText style={themed($hostText)}>{host}</PaperText>}
        </View>
      )}

      <IconButton
        icon="open-in-new"
        size={16}
        mode="contained-tonal"
        onPress={() => Linking.openURL(url).catch(() => {})}
        accessibilityLabel="Open in browser"
        style={themed($openBtn)}
      />

      {!!config.title && (
        <View style={themed($titleBar)} pointerEvents="none">
          <PaperText style={themed($title)} numberOfLines={1}>
            {config.title}
          </PaperText>
        </View>
      )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "#FFFFFF",
  overflow: "hidden",
})

const $webViewWrap: ThemedStyle<ViewStyle> = () => ({
  ...({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as const),
})

const $webView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "transparent",
})

const $loadingOverlay: ThemedStyle<ViewStyle> = () => ({
  ...({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as const),
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.85)",
})

const $errorOverlay: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  ...({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as const),
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0,0,0,0.85)",
  padding: spacing.sm,
  gap: spacing.xxs,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  fontSize: 12,
  textAlign: "center",
})

const $hostText: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255,255,255,0.75)",
  fontSize: 11,
})

const $openBtn: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  right: 0,
  margin: 2,
})

const $titleBar: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  backgroundColor: "rgba(0,0,0,0.55)",
})

const $title: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "700",
})

const $empty: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xxs,
  padding: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.8,
  fontSize: 11,
  textAlign: "center",
})
