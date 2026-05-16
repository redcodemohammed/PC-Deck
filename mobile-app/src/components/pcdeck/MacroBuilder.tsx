import { FC, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { MacroConfig, MacroStep } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { HotkeyRecorder, describeHotkey } from "./HotkeyRecorder"

interface MacroBuilderProps {
  value: MacroConfig | null
  onChange: (next: MacroConfig) => void
}

const STEP_TYPES: { value: MacroStep["type"]; label: string }[] = [
  { value: "hotkey", label: "Hotkey" },
  { value: "delay", label: "Delay" },
  { value: "text", label: "Type text" },
  { value: "open_url", label: "Open URL" },
]

function defaultStep(type: MacroStep["type"]): MacroStep {
  switch (type) {
    case "hotkey":
      return { type: "hotkey", hotkey: { modifiers: [], key: "" } }
    case "delay":
      return { type: "delay", ms: 250 }
    case "text":
      return { type: "text", text: "" }
    case "open_url":
      return { type: "open_url", url: "" }
    case "launch_app":
      return { type: "launch_app", app: { path: "" } }
  }
}

function describeStep(step: MacroStep): string {
  switch (step.type) {
    case "hotkey":
      return `Hotkey ${describeHotkey(step.hotkey)}`
    case "delay":
      return `Wait ${step.ms} ms`
    case "text":
      return `Type "${step.text || "…"}"`
    case "open_url":
      return `Open ${step.url || "URL"}`
    case "launch_app":
      return `Launch ${step.app.name ?? step.app.path}`
  }
}

export const MacroBuilder: FC<MacroBuilderProps> = ({ value, onChange }) => {
  const { themed, theme } = useAppTheme()
  const steps = value?.steps ?? []
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const update = (next: MacroStep[]) => onChange({ steps: next })

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= steps.length) return
    const next = steps.slice()
    ;[next[index], next[j]] = [next[j], next[index]]
    update(next)
  }

  const addStep = (type: MacroStep["type"]) => {
    update([...steps, defaultStep(type)])
    setOpenIndex(steps.length)
  }

  const removeStep = (index: number) => {
    update(steps.filter((_, i) => i !== index))
    if (openIndex === index) setOpenIndex(null)
  }

  const replaceStep = (index: number, step: MacroStep) => {
    const next = steps.slice()
    next[index] = step
    update(next)
  }

  return (
    <View style={themed($container)}>
      {steps.map((step, i) => {
        const open = openIndex === i
        return (
          <View key={`${i}-${step.type}`} style={themed($card)}>
            <Pressable onPress={() => setOpenIndex(open ? null : i)} style={themed($row)}>
              <Text
                text={`${i + 1}. ${describeStep(step)}`}
                numberOfLines={2}
                style={themed($title)}
              />
              <View style={themed($rowActions)}>
                <Pressable onPress={() => move(i, -1)} disabled={i === 0}>
                  <Text style={themed($iconBtn)} text="↑" />
                </Pressable>
                <Pressable onPress={() => move(i, 1)} disabled={i === steps.length - 1}>
                  <Text style={themed($iconBtn)} text="↓" />
                </Pressable>
                <Pressable onPress={() => removeStep(i)}>
                  <Text style={[themed($iconBtn), { color: theme.colors.error }]} text="✕" />
                </Pressable>
              </View>
            </Pressable>
            {open && (
              <View style={themed($body)}>
                <StepEditor step={step} onChange={(s) => replaceStep(i, s)} />
              </View>
            )}
          </View>
        )
      })}

      <Text preset="formLabel" text="Add step" />
      <View style={themed($addRow)}>
        {STEP_TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => addStep(t.value)}
            style={({ pressed }) => [themed($addChip), pressed && { opacity: 0.85 }]}
          >
            <Text style={themed($addChipText)} text={`+ ${t.label}`} />
          </Pressable>
        ))}
      </View>

      {steps.length > 0 && <Button preset="default" text="Clear" onPress={() => update([])} />}
    </View>
  )
}

const StepEditor: FC<{ step: MacroStep; onChange: (next: MacroStep) => void }> = ({
  step,
  onChange,
}) => {
  switch (step.type) {
    case "hotkey":
      return (
        <HotkeyRecorder
          value={step.hotkey}
          onChange={(hotkey) => onChange({ type: "hotkey", hotkey })}
        />
      )
    case "delay":
      return (
        <TextField
          value={String(step.ms)}
          onChangeText={(v) => onChange({ type: "delay", ms: Math.max(0, Number(v) || 0) })}
          label="Milliseconds"
          keyboardType="numeric"
        />
      )
    case "text":
      return (
        <TextField
          value={step.text}
          onChangeText={(text) => onChange({ type: "text", text })}
          label="Text to type"
          placeholder="Hello, world!"
        />
      )
    case "open_url":
      return (
        <TextField
          value={step.url}
          onChangeText={(url) => onChange({ type: "open_url", url })}
          label="URL"
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="url"
        />
      )
    case "launch_app":
      return (
        <TextField
          value={step.app.path}
          onChangeText={(path) => onChange({ type: "launch_app", app: { ...step.app, path } })}
          label="App path"
          autoCapitalize="none"
          autoCorrect={false}
        />
      )
  }
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
  padding: spacing.xs,
  gap: spacing.xs,
})
const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.xs,
})
const $rowActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})
const $title: ThemedStyle<TextStyle> = () => ({ flex: 1, fontWeight: "600" })
const $iconBtn: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  color: colors.text,
  paddingHorizontal: spacing.xxs,
})
const $body: ThemedStyle<ViewStyle> = ({ spacing }) => ({ paddingTop: spacing.xs, gap: spacing.xs })
const $addRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $addChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})
const $addChipText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.text })
