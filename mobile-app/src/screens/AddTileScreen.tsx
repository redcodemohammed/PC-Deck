import { FC, useMemo, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Card, Chip, SegmentedButtons, Text as PaperText } from "react-native-paper"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import {
  ActionConfigForm,
  ColorPicker,
  IconPicker,
} from "@/components/pcdeck"
import { TextField } from "@/components/TextField"
import type {
  ActionDefinition,
  ButtonKind,
  DeckButton,
  SliderConfig,
  ToggleConfig,
  WidgetConfig,
  WidgetType,
} from "@/services/pcdeck"
import { newButton, useActiveDecks, useDeckStore } from "@/stores/deckStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type Step = "type" | "size" | "configure"

const KINDS: { value: ButtonKind; label: string; helper: string }[] = [
  { value: "button", label: "Button", helper: "Runs one action on press" },
  { value: "toggle", label: "Toggle", helper: "Two states with separate actions" },
  { value: "slider", label: "Slider", helper: "Controls a continuous value" },
  { value: "widget", label: "Widget", helper: "Shows live desktop data" },
]

const SIZES = [
  { label: "1 x 1", rowSpan: 1, colSpan: 1 },
  { label: "2 x 1", rowSpan: 1, colSpan: 2 },
  { label: "1 x 2", rowSpan: 2, colSpan: 1 },
  { label: "2 x 2", rowSpan: 2, colSpan: 2 },
  { label: "3 x 1", rowSpan: 1, colSpan: 3 },
]

const WIDGET_TYPES: { value: WidgetType; label: string; helper: string }[] = [
  { value: "clock", label: "Clock", helper: "Time and date" },
  { value: "now_playing", label: "Now playing", helper: "Desktop media player" },
  { value: "website", label: "Website", helper: "Open a saved URL" },
  { value: "spotify", label: "Spotify", helper: "Placeholder widget" },
]

function defaultWidgetConfig(type: WidgetType): WidgetConfig {
  switch (type) {
    case "clock":
      return { type: "clock", config: { format: "24h", showSeconds: false, showDate: true } }
    case "website":
      return { type: "website", config: { url: "" } }
    case "now_playing":
      return { type: "now_playing", config: {} }
    case "spotify":
      return { type: "spotify", config: {} }
  }
}

export const AddTileScreen: FC = function AddTileScreen() {
  const { themed, theme } = useAppTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ deckId?: string; page?: string; row?: string; column?: string }>()
  const decks = useActiveDecks()
  const autoPlaceButton = useDeckStore((s) => s.autoPlaceButton)

  const deckId = String(params.deckId ?? "")
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const preferredPage = Math.max(0, Number(params.page ?? "0") || 0)

  const [step, setStep] = useState<Step>("type")
  const [kind, setKind] = useState<ButtonKind>("button")
  const [rowSpan, setRowSpan] = useState(1)
  const [colSpan, setColSpan] = useState(1)
  const [label, setLabel] = useState("Button")
  const [icon, setIcon] = useState("")
  const [color, setColor] = useState<string | null>(null)
  const [action, setAction] = useState<ActionDefinition | null>(null)
  const [toggle, setToggle] = useState<ToggleConfig>({ onLabel: "On", offLabel: "Off" })
  const [slider, setSlider] = useState<SliderConfig>({
    min: 0,
    max: 100,
    step: 1,
    initial: 50,
    bind: "volume",
  })
  const [widget, setWidget] = useState<WidgetConfig>(defaultWidgetConfig("clock"))
  const [saving, setSaving] = useState(false)

  if (!deck) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
        <Text preset="heading" text="Deck not found" />
      </Screen>
    )
  }

  const selectedSize = SIZES.find((s) => s.rowSpan === rowSpan && s.colSpan === colSpan) ?? SIZES[0]

  const save = async () => {
    setSaving(true)
    const button: Omit<DeckButton, "row" | "column"> = {
      ...newButton(0, 0),
      label: label.trim() || kindLabel(kind),
      icon,
      color,
      rowSpan,
      colSpan,
      kind,
      action: kind === "button" ? action : null,
      toggle: kind === "toggle" ? toggle : null,
      slider: kind === "slider" ? slider : null,
      widget: kind === "widget" ? widget : null,
    }
    await autoPlaceButton(deck.id, button, preferredPage)
    router.back()
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      <View style={themed($header)}>
        <Text preset="heading" text="Add tile" />
        <Text
          style={themed($helper)}
          text={`Auto-places on page ${preferredPage + 1}; if full, a new page is created.`}
        />
      </View>

      <SegmentedButtons
        value={step}
        onValueChange={(value) => setStep(value as Step)}
        buttons={[
          { value: "type", label: "Type" },
          { value: "size", label: "Size" },
          { value: "configure", label: "Configure" },
        ]}
      />

      {step === "type" && (
        <View style={themed($grid)}>
          {KINDS.map((item) => {
            const active = item.value === kind
            return (
              <Card
                key={item.value}
                mode="outlined"
                onPress={() => {
                  setKind(item.value)
                  setLabel(kindLabel(item.value))
                }}
                style={[
                  themed($optionCard),
                  active && { borderColor: theme.colors.tint, backgroundColor: theme.colors.palette.neutral200 },
                ]}
              >
                <Card.Content style={themed($optionContent)}>
                  <PaperText variant="titleMedium">{item.label}</PaperText>
                  <PaperText variant="bodySmall">{item.helper}</PaperText>
                </Card.Content>
              </Card>
            )
          })}
        </View>
      )}

      {step === "size" && (
        <View style={themed($section)}>
          <Text preset="subheading" text="Tile size" />
          <View style={themed($chipRow)}>
            {SIZES.filter((s) => s.rowSpan <= deck.rows && s.colSpan <= deck.columns).map((size) => {
              const active = size === selectedSize
              return (
                <Chip
                  key={size.label}
                  selected={active}
                  mode={active ? "flat" : "outlined"}
                  onPress={() => {
                    setRowSpan(size.rowSpan)
                    setColSpan(size.colSpan)
                  }}
                >
                  {size.label}
                </Chip>
              )
            })}
          </View>
          <SizePreview rows={rowSpan} columns={colSpan} />
        </View>
      )}

      {step === "configure" && (
        <View style={themed($section)}>
          <TextField value={label} onChangeText={setLabel} label="Label" />
          <Text preset="formLabel" text="Icon" />
          <IconPicker value={icon} onChange={setIcon} />
          <Text preset="formLabel" text="Color" />
          <ColorPicker value={color} onChange={setColor} />

          {kind === "button" && (
            <View style={themed($section)}>
              <Text preset="subheading" text="Action" />
              <ActionConfigForm value={action} onChange={setAction} />
            </View>
          )}

          {kind === "toggle" && (
            <View style={themed($section)}>
              <TextField
                value={toggle.onLabel ?? ""}
                onChangeText={(onLabel) => setToggle((prev) => ({ ...prev, onLabel }))}
                label="On label"
              />
              <ActionConfigForm
                value={toggle.onAction ?? null}
                onChange={(onAction) => setToggle((prev) => ({ ...prev, onAction }))}
                excludeTypes={["macro"]}
              />
              <TextField
                value={toggle.offLabel ?? ""}
                onChangeText={(offLabel) => setToggle((prev) => ({ ...prev, offLabel }))}
                label="Off label"
              />
              <ActionConfigForm
                value={toggle.offAction ?? null}
                onChange={(offAction) => setToggle((prev) => ({ ...prev, offAction }))}
                excludeTypes={["macro"]}
              />
            </View>
          )}

          {kind === "slider" && (
            <View style={themed($section)}>
              <Text preset="formLabel" text="Binding" />
              <SegmentedButtons
                value={slider.bind ?? "custom"}
                onValueChange={(bind) =>
                  setSlider((prev) => ({ ...prev, bind: bind as SliderConfig["bind"] }))
                }
                buttons={[
                  { value: "volume", label: "Volume" },
                  { value: "brightness", label: "Brightness" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </View>
          )}

          {kind === "widget" && (
            <View style={themed($section)}>
              <Text preset="subheading" text="Widget type" />
              <View style={themed($grid)}>
                {WIDGET_TYPES.map((item) => (
                  <Card
                    key={item.value}
                    mode="outlined"
                    onPress={() => setWidget(defaultWidgetConfig(item.value))}
                    style={[
                      themed($optionCard),
                      widget.type === item.value && {
                        borderColor: theme.colors.tint,
                        backgroundColor: theme.colors.palette.neutral200,
                      },
                    ]}
                  >
                    <Card.Content style={themed($optionContent)}>
                      <PaperText variant="titleMedium">{item.label}</PaperText>
                      <PaperText variant="bodySmall">{item.helper}</PaperText>
                    </Card.Content>
                  </Card>
                ))}
              </View>
              {widget.type === "website" && (
                <TextField
                  value={widget.config.url}
                  onChangeText={(url) => setWidget({ type: "website", config: { ...widget.config, url } })}
                  label="URL"
                  placeholder="https://example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  inputMode="url"
                />
              )}
            </View>
          )}
        </View>
      )}

      <View style={themed($actions)}>
        <Button preset="default" text="Cancel" onPress={() => router.back()} style={themed($action)} />
        {step !== "type" && (
          <Button
            preset="default"
            text="Back"
            onPress={() => setStep(step === "configure" ? "size" : "type")}
            style={themed($action)}
          />
        )}
        {step !== "configure" ? (
          <Button
            preset="filled"
            text="Next"
            onPress={() => setStep(step === "type" ? "size" : "configure")}
            style={themed($action)}
          />
        ) : (
          <Button
            preset="filled"
            text={saving ? "Adding..." : "Add tile"}
            onPress={save}
            disabled={saving}
            style={themed($action)}
          />
        )}
      </View>
    </Screen>
  )
}

const SizePreview: FC<{ rows: number; columns: number }> = ({ rows, columns }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($preview)}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={themed($previewRow)}>
          {Array.from({ length: columns }).map((__, column) => (
            <View key={column} style={themed($previewCell)} />
          ))}
        </View>
      ))}
    </View>
  )
}

function kindLabel(kind: ButtonKind): string {
  switch (kind) {
    case "button":
      return "Button"
    case "toggle":
      return "Toggle"
    case "slider":
      return "Slider"
    case "widget":
      return "Widget"
  }
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.md,
})
const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs })
const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })
const $grid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})
const $optionCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexBasis: "47%",
  flexGrow: 1,
  borderRadius: spacing.xs,
})
const $optionContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs })
const $chipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $preview: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignSelf: "flex-start",
  gap: 6,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
})
const $previewRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  gap: 6,
})
const $previewCell: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: colors.tint,
})
const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})
const $action: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
const $helper: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
