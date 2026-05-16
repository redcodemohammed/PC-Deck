import { FC, useMemo } from "react"
import { View, ViewStyle } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { ButtonEditor } from "@/components/pcdeck"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { ButtonKind, DeckButton } from "@/services/pcdeck"
import { newButton, useActiveDecks, useDeckStore } from "@/stores/deckStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const EditorScreen: FC = function EditorScreen() {
  const { themed } = useAppTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{
    deckId?: string
    buttonId?: string
    row?: string
    column?: string
    kind?: string
  }>()

  const decks = useActiveDecks()
  const upsertButton = useDeckStore((s) => s.upsertButton)
  const removeButton = useDeckStore((s) => s.removeButton)

  const deckId = String(params.deckId ?? "")
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])

  const button: DeckButton | undefined = useMemo(() => {
    if (!deck) return undefined
    if (params.buttonId) {
      return deck.buttons.find((b) => b.id === String(params.buttonId))
    }
    const row = Number(params.row ?? "0")
    const column = Number(params.column ?? "0")
    const fresh = newButton(row, column)
    if (params.kind && isValidKind(params.kind)) {
      fresh.kind = params.kind
    }
    return fresh
  }, [deck, params.buttonId, params.row, params.column, params.kind])

  if (!deck || !button) {
    return (
      <Screen
        preset="fixed"
        contentContainerStyle={themed($container)}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text preset="heading" text="Button not found" />
      </Screen>
    )
  }

  const handleSave = async (next: DeckButton) => {
    await upsertButton(deck.id, next)
    router.back()
  }

  const handleDelete = async (b: DeckButton) => {
    await removeButton(deck.id, b.id)
    router.back()
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" text="Edit button" />
      <View style={themed($body)}>
        <ButtonEditor
          button={button}
          gridRows={deck.rows}
          gridColumns={deck.columns}
          onSave={handleSave}
          onCancel={() => router.back()}
          onDelete={params.buttonId ? handleDelete : undefined}
        />
      </View>
    </Screen>
  )
}

function isValidKind(s: string): s is ButtonKind {
  return s === "button" || s === "toggle" || s === "slider" || s === "widget"
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.md,
})

const $body: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })
