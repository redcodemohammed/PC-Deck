import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PanResponder, ScrollView, TextStyle, View, ViewStyle } from "react-native"
import Animated, { FadeIn, FadeInDown, FadeOutDown } from "react-native-reanimated"
import { useFocusEffect, useRouter } from "expo-router"
import { Appbar, Chip, IconButton } from "react-native-paper"

import { Button } from "@/components/Button"
import { ConnectionStatus, DeckGrid, PageDots } from "@/components/pcdeck"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { WsClient, type WsStatus, type Deck, type DeckButton } from "@/services/pcdeck"
import { getApi, useConnectionStore } from "@/stores/connectionStore"
import { useActiveCurrentDeckId, useActiveDecks, useDeckStore } from "@/stores/deckStore"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"

export const DeckScreen: FC = function DeckScreen() {
  const { themed, theme } = useAppTheme()
  const router = useRouter()

  const activeDeviceId = useConnectionStore((s) => s.activeDeviceId)
  const activeDevice = useConnectionStore(
    (s) => s.devices.find((d) => d.id === s.activeDeviceId) ?? null,
  )
  const pairingStatus = useConnectionStore((s) => s.status)

  const decks = useActiveDecks()
  const currentDeckId = useActiveCurrentDeckId()
  const status = useDeckStore((s) => s.status)
  const error = useDeckStore((s) => s.error)
  const refresh = useDeckStore((s) => s.refresh)
  const createDeck = useDeckStore((s) => s.createDeck)
  const selectDeck = useDeckStore((s) => s.selectDeck)
  const moveButton = useDeckStore((s) => s.moveButton)
  const removeButton = useDeckStore((s) => s.removeButton)

  const [wsStatus, setWsStatus] = useState<WsStatus>("idle")
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({})
  const [sliderState, setSliderState] = useState<Record<string, number>>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const wsRef = useRef<WsClient | null>(null)

  useEffect(() => {
    if (!activeDevice) router.replace("/connect")
  }, [activeDevice, router])

  useFocusEffect(
    useCallback(() => {
      if (!activeDevice) return
      refresh()
    }, [activeDevice, refresh]),
  )

  useEffect(() => {
    if (!activeDevice) return
    const client = new WsClient({
      host: activeDevice.host,
      onStatus: setWsStatus,
      onEvent: (event) => {
        if (event.type === "deck_updated") {
          refresh()
        }
      },
    })
    client.start()
    wsRef.current = client
    return () => {
      client.stop()
      wsRef.current = null
    }
  }, [activeDevice, refresh])

  const currentDeck: Deck | undefined = useMemo(
    () => decks.find((d) => d.id === currentDeckId) ?? decks[0],
    [decks, currentDeckId],
  )

  const maxButtonPage = useMemo(() => {
    if (!currentDeck) return 0
    return currentDeck.buttons.reduce(
      (max, button) => Math.max(max, Math.max(0, Math.floor(button.page ?? 0))),
      0,
    )
  }, [currentDeck])

  // pageCount adapts to whichever is higher: the highest page that has tiles, or
  // the page the user has navigated to. This way "+ Page" can create empty pages
  // without needing to drop a tile first.
  const pageCount = Math.max(maxButtonPage, currentPage) + 1

  // Reset to page 0 when the active deck changes — otherwise the page index from
  // the previous deck leaks into the new one.
  useEffect(() => {
    setCurrentPage(0)
    setSelectedButtonId(null)
  }, [currentDeck?.id])

  const seedDeckState = useCallback((deck: Deck | undefined) => {
    if (!deck) return
    setToggleState((prev) => {
      const next = { ...prev }
      for (const b of deck.buttons) {
        if (b.kind === "toggle" && next[b.id] === undefined) {
          next[b.id] = !!b.toggle?.state
        }
      }
      return next
    })
    setSliderState((prev) => {
      const next = { ...prev }
      for (const b of deck.buttons) {
        if (b.kind === "slider" && next[b.id] === undefined) {
          next[b.id] = b.slider?.initial ?? 0
        }
      }
      return next
    })
  }, [])

  useEffect(() => {
    seedDeckState(currentDeck)
  }, [currentDeck, seedDeckState])

  const onPressButton = useCallback(
    async (button: DeckButton) => {
      if (!currentDeck || !button.action) return
      const api = getApi()
      if (!api) return
      try {
        await api.executeAction(currentDeck.id, button.id, button.action.id)
        setActionError(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Failed to execute")
      }
    },
    [currentDeck],
  )

  const onLongPressButton = useCallback(
    (button: DeckButton) => {
      setEditMode(true)
      setSelectedButtonId(button.id)
    },
    [],
  )

  const onPressEmpty = useCallback(
    (row: number, column: number) => {
      if (!currentDeck) return
      router.push({
        pathname: "/add-tile",
        params: {
          deckId: currentDeck.id,
          page: String(currentPage),
          row: String(row),
          column: String(column),
        },
      })
    },
    [currentDeck, currentPage, router],
  )

  const onToggle = useCallback(
    async (button: DeckButton, next: boolean) => {
      if (!currentDeck) return
      const previous = toggleState[button.id]
      setToggleState((prev) => ({ ...prev, [button.id]: next }))
      const action = next ? button.toggle?.onAction : button.toggle?.offAction
      if (!action) return
      const api = getApi()
      if (!api) return
      try {
        await api.executeAction(currentDeck.id, button.id, action.id)
        setActionError(null)
      } catch (e) {
        setToggleState((prev) => ({ ...prev, [button.id]: !!previous }))
        setActionError(e instanceof Error ? e.message : "Failed to toggle")
      }
    },
    [currentDeck, toggleState],
  )

  const onSlide = useCallback(
    async (button: DeckButton, value: number) => {
      if (!currentDeck) return
      const previous = sliderState[button.id]
      setSliderState((prev) => ({ ...prev, [button.id]: value }))
      const api = getApi()
      if (!api) return
      try {
        await api.setSliderValue(currentDeck.id, button.id, value)
        setActionError(null)
      } catch (e) {
        setSliderState((prev) => ({ ...prev, [button.id]: previous ?? value }))
        setActionError(e instanceof Error ? e.message : "Failed to update")
      }
    },
    [currentDeck, sliderState],
  )

  const onCreateDeck = useCallback(async () => {
    const deck = await createDeck(`Deck ${decks.length + 1}`)
    selectDeck(deck.id)
  }, [createDeck, decks.length, selectDeck])

  const onMoveDeckButton = useCallback(
    async (button: DeckButton, row: number, column: number) => {
      if (!currentDeck) return
      await moveButton(currentDeck.id, button.id, currentPage, row, column)
    },
    [currentDeck, currentPage, moveButton],
  )

  const onRemoveDeckButton = useCallback(
    async (button: DeckButton) => {
      if (!currentDeck) return
      await removeButton(currentDeck.id, button.id)
      setSelectedButtonId(null)
    },
    [currentDeck, removeButton],
  )

  const onEditDeckButton = useCallback(
    (button: DeckButton) => {
      if (!currentDeck) return
      router.push({ pathname: "/editor", params: { deckId: currentDeck.id, buttonId: button.id } })
    },
    [currentDeck, router],
  )

  const onAddTile = useCallback(() => {
    if (!currentDeck) return
    router.push({
      pathname: "/add-tile",
      params: { deckId: currentDeck.id, page: String(currentPage) },
    })
  }, [currentDeck, currentPage, router])

  const pageSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (editMode || pageCount <= 1) return false
          const horizontal = Math.abs(gesture.dx)
          const vertical = Math.abs(gesture.dy)
          return horizontal > 28 && horizontal > vertical * 1.4
        },
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          if (editMode || pageCount <= 1) return false
          const horizontal = Math.abs(gesture.dx)
          const vertical = Math.abs(gesture.dy)
          return horizontal > 28 && horizontal > vertical * 1.4
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 48) return
          setCurrentPage((page) => {
            const next = gesture.dx < 0 ? Math.min(page + 1, pageCount - 1) : Math.max(page - 1, 0)
            if (next !== page) setSelectedButtonId(null)
            return next
          })
        },
      }),
    [editMode, pageCount],
  )

  if (!activeDeviceId) return null

  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1} safeAreaEdges={["top", "bottom"]}>
      <Appbar.Header mode="small" elevated style={themed($appbar)}>
        <View style={themed($appbarStatus)}>
          <ConnectionStatus
            pairing={pairingStatus}
            socket={wsStatus}
            desktopName={activeDevice?.desktopName}
            host={activeDevice?.host}
          />
        </View>
        {editMode && (
          <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(180)}>
            <Appbar.Action
              icon="plus"
              onPress={onAddTile}
              accessibilityLabel="Add tile"
            />
          </Animated.View>
        )}
        <Appbar.Action
          icon={editMode ? "check" : "pencil"}
          onPress={() => {
            setEditMode((value) => !value)
            setSelectedButtonId(null)
          }}
          accessibilityLabel={editMode ? "Finish editing" : "Edit deck"}
        />
        <Appbar.Action
          icon="devices"
          onPress={() => router.push("/devices")}
          accessibilityLabel="Devices"
        />
        <Appbar.Action
          icon="cog"
          onPress={() => router.push("/settings")}
          accessibilityLabel="Settings"
        />
      </Appbar.Header>

      <View style={themed($deckChooser)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themed($chipScroll)}
        >
          {decks.map((d) => {
            const active = d.id === currentDeck?.id
            return (
              <Chip
                key={d.id}
                compact
                mode={active ? "flat" : "outlined"}
                selected={active}
                onPress={() => selectDeck(d.id)}
                onLongPress={() =>
                  router.push({ pathname: "/deck-settings", params: { deckId: d.id } })
                }
                style={themed($deckChip)}
                textStyle={themed($deckChipText)}
              >
                {d.name}
              </Chip>
            )
          })}
          <Chip
            compact
            icon="plus"
            mode="outlined"
            onPress={onCreateDeck}
            style={themed($deckChip)}
            textStyle={themed($deckChipText)}
          >
            New
          </Chip>
          {currentDeck && (
            <IconButton
              icon="cog"
              mode="outlined"
              onPress={() =>
                router.push({ pathname: "/deck-settings", params: { deckId: currentDeck.id } })
              }
              accessibilityLabel="Edit deck"
              size={20}
              style={themed($deckIconButton)}
            />
          )}
        </ScrollView>
      </View>

      <View style={themed($body)}>
        <View style={themed($gridContainer)} {...pageSwipeResponder.panHandlers}>
          {currentDeck ? (
            <Animated.View
              key={`${currentDeck.id}:${currentPage}`}
              entering={FadeIn.duration(180)}
              style={$styles.flex1}
            >
              <DeckGrid
                deck={currentDeck}
                page={currentPage}
                editMode={editMode}
                selectedButtonId={selectedButtonId}
                toggleState={toggleState}
                sliderState={sliderState}
                onPressButton={onPressButton}
                onLongPressButton={onLongPressButton}
                onPressEmpty={editMode ? onPressEmpty : undefined}
                onSelectButton={(button) => setSelectedButtonId(button.id)}
                onMoveButton={onMoveDeckButton}
                onRemoveButton={onRemoveDeckButton}
                onEditButton={onEditDeckButton}
                onToggle={onToggle}
                onSlide={onSlide}
              />
            </Animated.View>
          ) : (
            <View style={themed($emptyState)}>
              <Text preset="subheading" text={status === "loading" ? "Loading…" : "No decks yet"} />
              {status !== "loading" && (
                <Button preset="filled" text="Create your first deck" onPress={onCreateDeck} />
              )}
            </View>
          )}
        </View>
      </View>

      {(editMode || pageCount > 1) && currentDeck && (
        <PageDots
          count={pageCount}
          current={currentPage}
          editable={editMode}
          canRemoveCurrent={currentPage > maxButtonPage && pageCount > 1}
          onSelect={(page) => {
            setCurrentPage(page)
            setSelectedButtonId(null)
          }}
          onAdd={() => {
            setCurrentPage(pageCount)
            setSelectedButtonId(null)
          }}
          onRemove={() => {
            setCurrentPage(Math.max(0, currentPage - 1))
            setSelectedButtonId(null)
          }}
        />
      )}

      {!!(error || actionError) && (
        <View style={themed($errorBar)}>
          <Text style={themed($errorText)} text={actionError ?? error ?? ""} />
        </View>
      )}
    </Screen>
  )
}

const $appbar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $appbarStatus: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
})

const $deckChooser: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xs,
})

const $pageChooser: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xs,
})

const $chipScroll: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
  alignItems: "center",
})

const $deckChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  minHeight: 34,
  justifyContent: "center",
  borderRadius: spacing.xs,
  borderColor: colors.border,
})

const $deckChipText: ThemedStyle<TextStyle> = () => ({
  lineHeight: 18,
})

const $deckIconButton: ThemedStyle<ViewStyle> = () => ({
  width: 34,
  height: 34,
  margin: 0,
})

const $body: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  flexDirection: "row",
})

const $gridContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.md,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.md,
})

const $errorBar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.errorBackground,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })
