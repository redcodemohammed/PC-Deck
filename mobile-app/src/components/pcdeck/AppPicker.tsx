import { FC, Fragment, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { InstalledApp } from "@/services/pcdeck"
import { getApi } from "@/stores/connectionStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AppPickerProps {
  value: InstalledApp | null
  onChange: (app: InstalledApp) => void
}

export const AppPicker: FC<AppPickerProps> = ({ value, onChange }) => {
  const { themed, theme } = useAppTheme()
  const [apps, setApps] = useState<InstalledApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    const api = getApi()
    if (!api) {
      setLoading(false)
      setError("Not connected to a desktop")
      return
    }
    setLoading(true)
    api
      .listApps()
      .then((list) => {
        if (cancelled) return
        setApps(list)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to list apps")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return apps
    return apps.filter((a) => a.name.toLowerCase().includes(q))
  }, [apps, query])

  if (loading) {
    return (
      <View style={themed($loading)}>
        <ActivityIndicator color={theme.colors.tint} />
        <Text text="Loading apps from desktop…" />
      </View>
    )
  }

  if (error) {
    return <Text style={themed($error)} text={error} />
  }

  return (
    <View style={themed($container)}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView
        style={themed($list)}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <Text style={themed($empty)} text="No apps found." />
        ) : (
          filtered.map((item, idx) => {
            const active = value?.id === item.id
            return (
              <Fragment key={item.id}>
                <Pressable
                  onPress={() => onChange(item)}
                  style={({ pressed }) => [
                    themed($row),
                    active && {
                      backgroundColor: theme.colors.palette.primary100,
                      borderLeftWidth: 4,
                      borderLeftColor: theme.colors.tint,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {item.iconPng ? (
                    <Image
                      source={{ uri: `data:image/png;base64,${item.iconPng}` }}
                      style={$icon}
                    />
                  ) : (
                    <View style={themed($iconFallback)}>
                      <Text
                        style={themed($iconFallbackText)}
                        text={item.name.slice(0, 1).toUpperCase()}
                      />
                    </View>
                  )}
                  <View style={themed($info)}>
                    <Text text={item.name} numberOfLines={1} />
                    <Text style={themed($path)} text={item.path} numberOfLines={1} />
                  </View>
                  {active && <Text style={themed($check)} text="✓" />}
                </Pressable>
                {idx < filtered.length - 1 && <View style={themed($sep)} />}
              </Fragment>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs, height: 260 })
const $loading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.md,
  gap: spacing.xs,
})
const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })
const $list: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
})
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.xs,
  gap: spacing.xs,
})
const $icon = { width: 28, height: 28, borderRadius: 4 }
const $iconFallback: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 28,
  height: 28,
  borderRadius: 4,
  backgroundColor: colors.palette.secondary200,
  alignItems: "center",
  justifyContent: "center",
})
const $iconFallbackText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "700",
})
const $info: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
const $path: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
const $check: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 20,
  fontWeight: "700",
})
const $sep: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 1,
  backgroundColor: colors.separator,
})
const $empty: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  padding: spacing.md,
  textAlign: "center",
})
