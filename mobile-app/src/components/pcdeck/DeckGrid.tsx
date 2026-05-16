import { FC, useMemo, useState } from "react"
import { LayoutChangeEvent, PanResponder, View, ViewStyle } from "react-native"
import { IconButton } from "react-native-paper"

import type { Deck, DeckButton as DeckButtonModel } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { DeckButton } from "./DeckButton"
import { EmptySlot } from "./EmptySlot"

interface DeckGridProps {
  deck: Deck
  page?: number
  editMode?: boolean
  selectedButtonId?: string | null
  toggleState?: Record<string, boolean>
  sliderState?: Record<string, number>
  onPressButton?: (button: DeckButtonModel) => void
  onLongPressButton?: (button: DeckButtonModel) => void
  onPressEmpty?: (row: number, column: number) => void
  onSelectButton?: (button: DeckButtonModel) => void
  onMoveButton?: (button: DeckButtonModel, row: number, column: number) => void
  onRemoveButton?: (button: DeckButtonModel) => void
  onEditButton?: (button: DeckButtonModel) => void
  onToggle?: (button: DeckButtonModel, next: boolean) => void
  onSlide?: (button: DeckButtonModel, value: number) => void
  disabled?: boolean
}

export const DeckGrid: FC<DeckGridProps> = ({
  deck,
  page = 0,
  editMode = false,
  selectedButtonId,
  toggleState,
  sliderState,
  onPressButton,
  onLongPressButton,
  onPressEmpty,
  onSelectButton,
  onMoveButton,
  onRemoveButton,
  onEditButton,
  onToggle,
  onSlide,
  disabled,
}) => {
  const { themed, theme } = useAppTheme()
  const [size, setSize] = useState({ width: 0, height: 0 })

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setSize({ width, height })
  }

  const gap = theme.spacing.sm
  const cellW =
    size.width && deck.columns > 0
      ? (size.width - gap * (deck.columns - 1)) / deck.columns
      : 0
  const cellH =
    size.height && deck.rows > 0
      ? (size.height - gap * (deck.rows - 1)) / deck.rows
      : 0

  // Build occupancy map of cells covered by button spans.
  const occupied = new Set<string>()
  const startCells = new Map<string, DeckButtonModel>()
  const pageButtons = deck.buttons.filter((b) => buttonPage(b) === page)
  for (const b of pageButtons) {
    const rs = clampSpan(b.rowSpan, b.row, deck.rows)
    const cs = clampSpan(b.colSpan, b.column, deck.columns)
    startCells.set(cellKey(b.row, b.column), b)
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        occupied.add(cellKey(b.row + dr, b.column + dc))
      }
    }
  }

  const positionStyle = (r: number, c: number, rs: number, cs: number): ViewStyle => ({
    position: "absolute",
    left: c * (cellW + gap),
    top: r * (cellH + gap),
    width: cs * cellW + (cs - 1) * gap,
    height: rs * cellH + (rs - 1) * gap,
  })

  return (
    <View style={themed($container)} onLayout={onLayout}>
      {cellW > 0 &&
        cellH > 0 &&
        Array.from({ length: deck.rows }).flatMap((_, r) =>
          Array.from({ length: deck.columns }).map((_, c) => {
            const key = cellKey(r, c)
            const btn = startCells.get(key)
            if (btn) {
              const rs = clampSpan(btn.rowSpan, btn.row, deck.rows)
              const cs = clampSpan(btn.colSpan, btn.column, deck.columns)
              return (
                <DraggableTile
                  key={key}
                  button={btn}
                  row={r}
                  column={c}
                  rows={deck.rows}
                  columns={deck.columns}
                  rowSpan={rs}
                  colSpan={cs}
                  cellWidth={cellW}
                  cellHeight={cellH}
                  gap={gap}
                  editMode={editMode}
                  selected={selectedButtonId === btn.id}
                  style={positionStyle(r, c, rs, cs)}
                  onSelect={onSelectButton}
                  onMove={onMoveButton}
                  onRemove={onRemoveButton}
                  onEdit={onEditButton}
                >
                  <DeckButton
                    button={btn}
                    width={cs * cellW + (cs - 1) * gap}
                    height={rs * cellH + (rs - 1) * gap}
                    toggleState={toggleState?.[btn.id]}
                    sliderValue={sliderState?.[btn.id]}
                    onPress={() => (editMode ? onSelectButton?.(btn) : onPressButton?.(btn))}
                    onLongPress={() => (editMode ? onSelectButton?.(btn) : onLongPressButton?.(btn))}
                    onToggle={(next) => onToggle?.(btn, next)}
                    onSlide={(v) => onSlide?.(btn, v)}
                    disabled={disabled || editMode}
                  />
                </DraggableTile>
              )
            }
            if (occupied.has(key)) return null
            return (
              <View key={key} style={positionStyle(r, c, 1, 1)}>
                <EmptySlot
                  width={cellW}
                  height={cellH}
                  editable={editMode}
                  onPress={editMode ? () => onPressEmpty?.(r, c) : undefined}
                />
              </View>
            )
          }),
        )}
    </View>
  )
}

interface DraggableTileProps {
  button: DeckButtonModel
  row: number
  column: number
  rows: number
  columns: number
  rowSpan: number
  colSpan: number
  cellWidth: number
  cellHeight: number
  gap: number
  editMode: boolean
  selected: boolean
  style: ViewStyle
  children: React.ReactNode
  onSelect?: (button: DeckButtonModel) => void
  onMove?: (button: DeckButtonModel, row: number, column: number) => void
  onRemove?: (button: DeckButtonModel) => void
  onEdit?: (button: DeckButtonModel) => void
}

const DraggableTile: FC<DraggableTileProps> = ({
  button,
  row,
  column,
  rows,
  columns,
  rowSpan,
  colSpan,
  cellWidth,
  cellHeight,
  gap,
  editMode,
  selected,
  style,
  children,
  onSelect,
  onMove,
  onRemove,
  onEdit,
}) => {
  const { themed } = useAppTheme()
  const [drag, setDrag] = useState({ x: 0, y: 0 })

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          editMode && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
        onPanResponderGrant: () => {
          onSelect?.(button)
          setDrag({ x: 0, y: 0 })
        },
        onPanResponderMove: (_, gesture) => {
          setDrag({ x: gesture.dx, y: gesture.dy })
        },
        onPanResponderRelease: (_, gesture) => {
          const rowDelta = Math.round(gesture.dy / (cellHeight + gap))
          const columnDelta = Math.round(gesture.dx / (cellWidth + gap))
          const nextRow = clamp(row + rowDelta, 0, rows - rowSpan)
          const nextColumn = clamp(column + columnDelta, 0, columns - colSpan)
          setDrag({ x: 0, y: 0 })
          if (nextRow !== row || nextColumn !== column) {
            onMove?.(button, nextRow, nextColumn)
          }
        },
        onPanResponderTerminate: () => setDrag({ x: 0, y: 0 }),
      }),
    [
      button,
      cellHeight,
      cellWidth,
      colSpan,
      column,
      columns,
      editMode,
      gap,
      onMove,
      onSelect,
      row,
      rowSpan,
      rows,
    ],
  )

  return (
    <View
      style={[
        style,
        editMode && themed($editableTile),
        selected && themed($selectedTile),
        editMode && { transform: [{ translateX: drag.x }, { translateY: drag.y }], zIndex: selected ? 20 : 10 },
      ]}
      {...(editMode ? panResponder.panHandlers : {})}
      onTouchStart={() => {
        if (editMode) onSelect?.(button)
      }}
    >
      {children}
      {editMode && selected && (
        <View style={themed($tileActions)} pointerEvents="box-none">
          <IconButton
            icon="pencil"
            mode="contained-tonal"
            size={16}
            onPress={() => onEdit?.(button)}
            accessibilityLabel="Edit tile"
            style={themed($tileAction)}
          />
          <IconButton
            icon="delete"
            mode="contained-tonal"
            size={16}
            onPress={() => onRemove?.(button)}
            accessibilityLabel="Remove tile"
            style={themed($tileAction)}
          />
        </View>
      )}
    </View>
  )
}

function cellKey(r: number, c: number): string {
  return `${r}:${c}`
}

function buttonPage(button: DeckButtonModel): number {
  return Math.max(0, Math.floor(button.page ?? 0))
}

function clampSpan(span: number | undefined, origin: number, total: number): number {
  const raw = Math.max(1, Math.floor(span ?? 1))
  return Math.min(raw, total - origin)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $editableTile: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 12,
})

const $selectedTile: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderWidth: 2,
  borderColor: colors.tint,
})

const $tileActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: -12,
  right: -12,
  flexDirection: "row",
  gap: spacing.xxxs,
})

const $tileAction: ThemedStyle<ViewStyle> = () => ({
  width: 32,
  height: 32,
  margin: 0,
})
