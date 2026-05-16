import { FC, useMemo, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { SizePicker } from "@/components/pcdeck/SizePicker"
import { PRESETS, findPresetPlacement } from "@/components/pcdeck/presets"
import { useActiveDecks, useDeckStore } from "@/stores/deckStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const MAX_ROWS = 6
const MAX_COLS = 10

export const DeckSettingsScreen: FC = function DeckSettingsScreen() {
  const { themed, theme } = useAppTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ deckId?: string }>()
  const decks = useActiveDecks()
  const saveDeck = useDeckStore((s) => s.saveDeck)
  const removeDeck = useDeckStore((s) => s.removeDeck)
  const insertButtons = useDeckStore((s) => s.insertButtons)

  const deckId = String(params.deckId ?? "")
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])

  const [name, setName] = useState(deck?.name ?? "")
  const [rows, setRows] = useState(deck?.rows ?? 3)
  const [columns, setColumns] = useState(deck?.columns ?? 5)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [presetMessage, setPresetMessage] = useState<string | null>(null)

  if (!deck) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
        <Text preset="heading" text="Deck not found" />
      </Screen>
    )
  }

  const truncated = deck.buttons.filter((b) => {
    const rs = b.rowSpan ?? 1
    const cs = b.colSpan ?? 1
    return b.row + rs > rows || b.column + cs > columns
  })

  const handleSave = async () => {
    const buttons = deck.buttons.filter((b) => {
      const rs = b.rowSpan ?? 1
      const cs = b.colSpan ?? 1
      return b.row + rs <= rows && b.column + cs <= columns
    })
    await saveDeck({ ...deck, name: name.trim() || deck.name, rows, columns, buttons })
    router.back()
  }

  const handleDelete = async () => {
    await removeDeck(deck.id)
    router.replace("/deck")
  }

  const handleInsertPreset = async (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const placement = findPresetPlacement(deck, preset.width, preset.height)
    if (!placement) {
      setPresetMessage(
        `Not enough room. Need ${preset.width}×${preset.height}; resize the deck and try again.`,
      )
      return
    }
    const newButtons = preset.build(placement.row, placement.column)
    await insertButtons(deck.id, newButtons)
    setPresetMessage(
      `Inserted "${preset.label}" at row ${placement.row + 1}, column ${placement.column + 1}.`,
    )
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" text="Edit deck" />

      <TextField value={name} onChangeText={setName} label="Deck name" />

      <Text preset="formLabel" text="Grid size" />
      <SizePicker
        rows={rows}
        columns={columns}
        maxRows={MAX_ROWS}
        maxColumns={MAX_COLS}
        onChange={(r, c) => {
          setRows(r)
          setColumns(c)
        }}
      />

      {truncated.length > 0 && (
        <Text
          style={themed($warning)}
          text={`Heads up: ${truncated.length} button${
            truncated.length === 1 ? "" : "s"
          } no longer fit and will be removed on save.`}
        />
      )}

      <View style={themed($actions)}>
        <Button preset="filled" text="Save" onPress={handleSave} style={themed($actionBtn)} />
        <Button preset="default" text="Cancel" onPress={() => router.back()} style={themed($actionBtn)} />
      </View>

      <View style={themed($section)}>
        <Text preset="subheading" text="Insert preset" />
        <Text style={themed($helper)} text="Drops pre-configured buttons into the next free space." />
        <View style={themed($presetGrid)}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => handleInsertPreset(p.id)}
              style={({ pressed }) => [themed($presetCard), pressed && { opacity: 0.85 }]}
            >
              <Text style={themed($presetLabel)} text={p.label} />
              <Text style={themed($presetDesc)} text={p.description} />
              <Text
                style={themed($presetSize)}
                text={`${p.height}×${p.width} cells`}
              />
            </Pressable>
          ))}
        </View>
        {!!presetMessage && (
          <Text style={[themed($helper), { color: theme.colors.tint }]} text={presetMessage} />
        )}
      </View>

      <View style={themed($dangerZone)}>
        <Text preset="subheading" text="Danger zone" />
        <Button
          preset="reversed"
          text={confirmDelete ? "Confirm delete" : "Delete this deck"}
          onPress={() => {
            if (confirmDelete) handleDelete()
            else setConfirmDelete(true)
          }}
        />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.md,
})

const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({ flexDirection: "row", gap: spacing.xs })
const $actionBtn: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
const $warning: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })
const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })
const $helper: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 12 })
const $presetGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $presetCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexBasis: "48%",
  flexGrow: 1,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: spacing.xs,
  gap: spacing.xxs,
})
const $presetLabel: ThemedStyle<TextStyle> = () => ({ fontWeight: "700" })
const $presetDesc: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
const $presetSize: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 10 })

const $dangerZone: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.lg,
  paddingTop: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  gap: spacing.sm,
})
