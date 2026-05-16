import { FC, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Chip } from "react-native-paper"

import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { ActionDefinition, ActionType, HotkeyConfig, MacroConfig } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AppPicker } from "./AppPicker"
import { HotkeyRecorder } from "./HotkeyRecorder"
import { MacroBuilder } from "./MacroBuilder"

interface ActionConfigFormProps {
  value: ActionDefinition | null
  onChange: (next: ActionDefinition | null) => void
  /** Hide action types that don't make sense in the current context (e.g. nested macros). */
  excludeTypes?: ActionType[]
}

const ACTION_TYPES: { value: ActionType; label: string; helper: string }[] = [
  { value: "hotkey", label: "Hotkey", helper: "Press a key combo" },
  { value: "launch_app", label: "Launch app", helper: "Pick from installed apps" },
  { value: "open_url", label: "Open URL", helper: "Open in default browser" },
  { value: "shell_command", label: "Shell", helper: "Allow-listed shell command" },
  { value: "macro", label: "Macro", helper: "Sequence of steps" },
]

function makeId() {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export const ActionConfigForm: FC<ActionConfigFormProps> = ({ value, onChange, excludeTypes }) => {
  const { themed, theme } = useAppTheme()
  const available = ACTION_TYPES.filter((t) => !excludeTypes?.includes(t.value))

  const [type, setType] = useState<ActionType>(value?.type ?? available[0].value)
  const [name, setName] = useState<string>(value?.name ?? "")
  const [config, setConfig] = useState<Record<string, unknown>>(value?.config ?? {})

  useEffect(() => {
    if (!isActionComplete(type, config)) {
      onChange(null)
      return
    }
    onChange({ id: value?.id ?? makeId(), type, name: name || nameForType(type, config), config })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, name, config])

  const setConfigKey = (key: string, val: unknown) => setConfig((prev) => ({ ...prev, [key]: val }))

  return (
    <View style={themed($container)}>
      <Text preset="formLabel" text="Action type" />
      <View style={themed($typeRow)}>
        {available.map((t) => {
          const selected = t.value === type
          return (
            <Chip
              key={t.value}
              mode={selected ? "flat" : "outlined"}
              selected={selected}
              onPress={() => setType(t.value)}
              style={themed($chip)}
              textStyle={themed($chipText)}
            >
              {t.label}
            </Chip>
          )
        })}
      </View>

      <TextField
        value={name}
        onChangeText={setName}
        label="Action name"
        placeholder="Quick description (optional)"
      />

      <View style={themed($body)}>
        {type === "hotkey" && (
          <HotkeyRecorder
            value={(config.hotkey as HotkeyConfig | undefined) ?? null}
            onChange={(hotkey) => setConfigKey("hotkey", hotkey)}
          />
        )}
        {type === "launch_app" && (
          <AppPicker
            value={(config.app as { id: string; name: string; path: string } | undefined) ?? null}
            onChange={(app) => setConfigKey("app", app)}
          />
        )}
        {type === "open_url" && (
          <TextField
            value={(config.url as string) ?? ""}
            onChangeText={(url) => setConfigKey("url", url)}
            label="URL"
            placeholder="https://…"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="url"
          />
        )}
        {type === "shell_command" && (
          <TextField
            value={(config.command as string) ?? ""}
            onChangeText={(command) => setConfigKey("command", command)}
            label="Command"
            helper="Daemon must allow shell commands"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        {type === "macro" && (
          <MacroBuilder
            value={(config.macro as MacroConfig | undefined) ?? null}
            onChange={(macro) => setConfigKey("macro", macro)}
          />
        )}
      </View>
    </View>
  )
}

function isActionComplete(type: ActionType, config: Record<string, unknown>): boolean {
  switch (type) {
    case "hotkey":
      return !!(config.hotkey as HotkeyConfig | undefined)?.key
    case "launch_app":
      return !!(config.app as { path?: string } | undefined)?.path
    case "open_url":
      return !!(config.url as string | undefined)
    case "shell_command":
      return !!(config.command as string | undefined)
    case "macro":
      return ((config.macro as MacroConfig | undefined)?.steps?.length ?? 0) > 0
  }
}

function nameForType(type: ActionType, config: Record<string, unknown>): string {
  switch (type) {
    case "hotkey":
      return "Hotkey"
    case "launch_app": {
      const app = config.app as { name?: string } | undefined
      return app?.name ? `Launch ${app.name}` : "Launch app"
    }
    case "open_url":
      return "Open URL"
    case "shell_command":
      return "Shell command"
    case "macro":
      return "Macro"
  }
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })

const $typeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
})

const $chipText: ThemedStyle<TextStyle> = () => ({})

const $body: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })
