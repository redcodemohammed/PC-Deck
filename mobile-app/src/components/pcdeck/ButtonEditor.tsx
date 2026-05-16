import { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Card, Chip, Switch } from "react-native-paper"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
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
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { ActionConfigForm } from "./ActionConfigForm"
import { ColorPicker } from "./ColorPicker"
import { IconPicker } from "./IconPicker"
import { TileSizePicker } from "./TileSizePicker"

interface ButtonEditorProps {
  button: DeckButton
  /** Total grid rows — used to cap rowSpan choices. */
  gridRows: number
  /** Total grid columns — used to cap colSpan choices. */
  gridColumns: number
  /** Buttons on the same page (excluding the one being edited). Their cells
   *  show as red in the size picker so the user can't overlap them. */
  otherButtons?: DeckButton[]
  onSave: (button: DeckButton) => void
  onDelete?: (button: DeckButton) => void
  onCancel?: () => void
}

const KINDS: { value: ButtonKind; label: string; helper: string }[] = [
  { value: "button", label: "Button", helper: "Runs one action on press" },
  { value: "toggle", label: "Toggle", helper: "Two states with different actions" },
  { value: "slider", label: "Slider", helper: "Continuous value, e.g. volume" },
  { value: "widget", label: "Widget", helper: "Live data tile (clock, now playing, …)" },
]

const WIDGET_TYPES: { value: WidgetType; label: string; helper: string }[] = [
  { value: "clock", label: "Clock", helper: "Time + date" },
  { value: "now_playing", label: "Now playing", helper: "From the desktop's media player" },
  { value: "website", label: "Website", helper: "Tap to open" },
  { value: "spotify", label: "Spotify", helper: "OAuth pending" },
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

export const ButtonEditor: FC<ButtonEditorProps> = ({
  button,
  gridRows,
  gridColumns,
  otherButtons,
  onSave,
  onDelete,
  onCancel,
}) => {
  const { themed, theme } = useAppTheme()
  const [label, setLabel] = useState(button.label)
  const [icon, setIcon] = useState(button.icon)
  const [color, setColor] = useState<string | null>(button.color ?? null)
  const [rowSpan, setRowSpan] = useState<number>(button.rowSpan ?? 1)
  const [colSpan, setColSpan] = useState<number>(button.colSpan ?? 1)
  const [kind, setKind] = useState<ButtonKind>(button.kind ?? "button")
  const [action, setAction] = useState<ActionDefinition | null>(button.action ?? null)
  const [toggle, setToggle] = useState<ToggleConfig>(
    button.toggle ?? {
      onLabel: button.label,
      offLabel: button.label,
      onIcon: button.icon,
      offIcon: button.icon,
      onColor: null,
      offColor: null,
    },
  )
  const [slider, setSlider] = useState<SliderConfig>(
    button.slider ?? { min: 0, max: 100, step: 1, initial: 50, bind: "volume" },
  )
  const [widget, setWidget] = useState<WidgetConfig>(
    button.widget ?? defaultWidgetConfig("clock"),
  )

  const handleSave = () => {
    onSave({
      ...button,
      label,
      icon,
      color: color ?? null,
      rowSpan,
      colSpan,
      kind,
      action: kind === "button" ? action : null,
      toggle: kind === "toggle" ? toggle : null,
      slider: kind === "slider" ? slider : null,
      widget: kind === "widget" ? widget : null,
    })
  }

  const updateToggle = (patch: Partial<ToggleConfig>) => setToggle((prev) => ({ ...prev, ...patch }))

  return (
    <View style={themed($container)}>
      <Text preset="subheading" text={`Row ${button.row + 1} · Column ${button.column + 1}`} />

      <Text preset="formLabel" text="Size" />
      <TileSizePicker
        rows={gridRows}
        columns={gridColumns}
        otherButtons={otherButtons}
        anchorRow={button.row}
        anchorColumn={button.column}
        value={{ row: button.row, column: button.column, rowSpan, colSpan }}
        onChange={(next) => {
          if (!next) return // anchored mode never emits null
          setRowSpan(next.rowSpan)
          setColSpan(next.colSpan)
        }}
      />

      <TextField value={label} onChangeText={setLabel} label="Label" />

      <Text preset="formLabel" text="Icon" />
      <IconPicker value={icon} onChange={setIcon} />

      <Text preset="formLabel" text="Color" />
      <ColorPicker value={color} onChange={setColor} />

      <Text preset="formLabel" text="Button kind" />
      <View style={themed($kindRow)}>
        {KINDS.map((k) => {
          const active = k.value === kind
          return (
            <Card
              key={k.value}
              onPress={() => setKind(k.value)}
              mode="outlined"
              style={[
                themed($kindCard),
                active && {
                  borderColor: theme.colors.tint,
                  backgroundColor: theme.colors.palette.neutral200,
                },
              ]}
            >
              <Card.Content style={themed($kindContent)}>
                <Text style={themed($kindLabel)} text={k.label} />
                <Text style={themed($kindHelper)} text={k.helper} />
              </Card.Content>
            </Card>
          )
        })}
      </View>

      {kind === "button" && (
        <View style={themed($section)}>
          <Text preset="subheading" text="Action" />
          <ActionConfigForm value={action} onChange={setAction} />
        </View>
      )}

      {kind === "toggle" && (
        <View style={themed($section)}>
          <Text preset="subheading" text="When ON" />
          <TextField
            value={toggle.onLabel ?? ""}
            onChangeText={(v) => updateToggle({ onLabel: v })}
            label="On label"
            placeholder={label}
          />
          <Text preset="formLabel" text="On icon" />
          <IconPicker
            value={toggle.onIcon ?? ""}
            onChange={(v) => updateToggle({ onIcon: v })}
          />
          <Text preset="formLabel" text="On color" />
          <ColorPicker
            value={toggle.onColor ?? null}
            onChange={(v) => updateToggle({ onColor: v })}
          />
          <Text preset="formLabel" text="On action" />
          <ActionConfigForm
            value={toggle.onAction ?? null}
            onChange={(onAction) => updateToggle({ onAction })}
            excludeTypes={["macro"]}
          />

          <Text preset="subheading" text="When OFF" />
          <TextField
            value={toggle.offLabel ?? ""}
            onChangeText={(v) => updateToggle({ offLabel: v })}
            label="Off label"
            placeholder={label}
          />
          <Text preset="formLabel" text="Off icon" />
          <IconPicker
            value={toggle.offIcon ?? ""}
            onChange={(v) => updateToggle({ offIcon: v })}
          />
          <Text preset="formLabel" text="Off color" />
          <ColorPicker
            value={toggle.offColor ?? null}
            onChange={(v) => updateToggle({ offColor: v })}
          />
          <Text preset="formLabel" text="Off action" />
          <ActionConfigForm
            value={toggle.offAction ?? null}
            onChange={(offAction) => updateToggle({ offAction })}
            excludeTypes={["macro"]}
          />
        </View>
      )}

      {kind === "slider" && (
        <View style={themed($section)}>
          <Text preset="subheading" text="Slider range" />
          <View style={themed($rangeRow)}>
            <TextField
              value={String(slider.min)}
              onChangeText={(v) => setSlider({ ...slider, min: Number(v) || 0 })}
              label="Min"
              keyboardType="numeric"
              containerStyle={themed($rangeField)}
            />
            <TextField
              value={String(slider.max)}
              onChangeText={(v) => setSlider({ ...slider, max: Number(v) || 0 })}
              label="Max"
              keyboardType="numeric"
              containerStyle={themed($rangeField)}
            />
            <TextField
              value={String(slider.step)}
              onChangeText={(v) => setSlider({ ...slider, step: Math.max(1, Number(v) || 1) })}
              label="Step"
              keyboardType="numeric"
              containerStyle={themed($rangeField)}
            />
          </View>
          <TextField
            value={String(slider.initial)}
            onChangeText={(v) => setSlider({ ...slider, initial: Number(v) || 0 })}
            label="Initial value"
            keyboardType="numeric"
          />
          <Text preset="formLabel" text="Binding" />
          <View style={themed($kindRow)}>
            {(["volume", "brightness", "custom"] as const).map((b) => {
              const active = (slider.bind ?? "custom") === b
              return (
                <Chip
                  key={b}
                  mode={active ? "flat" : "outlined"}
                  selected={active}
                  onPress={() => setSlider({ ...slider, bind: b })}
                  style={themed($bindChip)}
                  textStyle={themed($chipText)}
                >
                  {b}
                </Chip>
              )
            })}
          </View>
        </View>
      )}

      {kind === "widget" && (
        <View style={themed($section)}>
          <Text preset="subheading" text="Widget type" />
          <View style={themed($kindRow)}>
            {WIDGET_TYPES.map((w) => {
              const active = widget.type === w.value
              return (
                <Card
                  key={w.value}
                  onPress={() => setWidget(defaultWidgetConfig(w.value))}
                  mode="outlined"
                  style={[
                    themed($kindCard),
                    active && {
                      borderColor: theme.colors.tint,
                      backgroundColor: theme.colors.palette.neutral200,
                    },
                  ]}
                >
                  <Card.Content style={themed($kindContent)}>
                    <Text style={themed($kindLabel)} text={w.label} />
                    <Text style={themed($kindHelper)} text={w.helper} />
                  </Card.Content>
                </Card>
              )
            })}
          </View>

          {widget.type === "clock" && (
            <View style={themed($section)}>
              <Text preset="formLabel" text="Format" />
              <View style={themed($kindRow)}>
                {(["24h", "12h"] as const).map((f) => {
                  const active = (widget.config.format ?? "24h") === f
                  return (
                    <Chip
                      key={f}
                      mode={active ? "flat" : "outlined"}
                      selected={active}
                      onPress={() =>
                        setWidget({
                          type: "clock",
                          config: { ...widget.config, format: f },
                        })
                      }
                      style={themed($bindChip)}
                      textStyle={themed($chipText)}
                    >
                      {f}
                    </Chip>
                  )
                })}
              </View>
              <View
                style={themed($toggleRow)}
              >
                <Text text="Show seconds" />
                <Switch
                  value={!!widget.config.showSeconds}
                  onValueChange={(showSeconds) =>
                    setWidget({
                      type: "clock",
                      config: { ...widget.config, showSeconds },
                    })
                  }
                />
              </View>
              <View
                style={themed($toggleRow)}
              >
                <Text text="Show date" />
                <Switch
                  value={!!widget.config.showDate}
                  onValueChange={(showDate) =>
                    setWidget({
                      type: "clock",
                      config: { ...widget.config, showDate },
                    })
                  }
                />
              </View>
            </View>
          )}

          {widget.type === "website" && (
            <View style={themed($section)}>
              <TextField
                value={widget.config.url}
                onChangeText={(url) =>
                  setWidget({ type: "website", config: { ...widget.config, url } })
                }
                label="URL"
                placeholder="https://example.com"
                autoCapitalize="none"
                autoCorrect={false}
                inputMode="url"
              />
              <TextField
                value={widget.config.title ?? ""}
                onChangeText={(title) =>
                  setWidget({ type: "website", config: { ...widget.config, title } })
                }
                label="Title (optional)"
              />
            </View>
          )}

          {widget.type === "now_playing" && (
            <View style={themed($section)}>
              <TextField
                value={widget.config.player ?? ""}
                onChangeText={(player) =>
                  setWidget({ type: "now_playing", config: { ...widget.config, player } })
                }
                label="Player (optional)"
                helper="e.g. 'spotify', 'firefox' — leave blank for any active player"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {widget.type === "spotify" && (
            <Text
              style={themed($kindHelper)}
              text="Spotify needs an OAuth client; the widget renders a placeholder for now."
            />
          )}
        </View>
      )}

      <View style={themed($actions)}>
        <Button preset="filled" text="Save" onPress={handleSave} style={themed($actionBtn)} />
        {onCancel && (
          <Button preset="default" text="Cancel" onPress={onCancel} style={themed($actionBtn)} />
        )}
        {onDelete && (
          <Button
            preset="reversed"
            text="Delete"
            onPress={() => onDelete(button)}
            style={themed($actionBtn)}
          />
        )}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })
const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $kindRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $kindCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexBasis: "30%",
  flexGrow: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
})
const $kindContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs, padding: spacing.sm })
const $kindLabel: ThemedStyle<TextStyle> = () => ({ fontWeight: "600" })
const $kindHelper: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
const $rangeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({ flexDirection: "row", gap: spacing.xs })
const $rangeField: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
const $bindChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})
const $chipText: ThemedStyle<TextStyle> = () => ({})
const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginTop: spacing.sm,
})
const $actionBtn: ThemedStyle<ViewStyle> = () => ({ flex: 1 })

const $toggleRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})
