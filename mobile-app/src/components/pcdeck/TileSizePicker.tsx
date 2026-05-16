import { FC, useMemo } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import type { DeckButton } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface TileSelection {
  row: number
  column: number
  rowSpan: number
  colSpan: number
}

interface TileSizePickerProps {
  rows: number
  columns: number
  /** Other buttons on the same page — their cells render in red and can't be
   *  used as anchor / part of the rectangle. */
  otherButtons?: DeckButton[]
  /** Fixed anchor — when set, the picker is "anchored" mode: the anchor cell
   *  is locked and the user only picks the bottom-right of the rectangle. */
  anchorRow?: number
  anchorColumn?: number
  /** Current selection (controlled). In anchored mode `.row`/`.column` is the
   *  fixed anchor and only span changes. In unanchored mode this can be null
   *  to mean "nothing picked yet". */
  value: TileSelection | null
  onChange: (next: TileSelection | null) => void
}

const CELL_BASE = 28
const GAP = 4

export const TileSizePicker: FC<TileSizePickerProps> = ({
  rows,
  columns,
  otherButtons,
  anchorRow,
  anchorColumn,
  value,
  onChange,
}) => {
  const { themed, theme } = useAppTheme()
  const anchored = typeof anchorRow === "number" && typeof anchorColumn === "number"

  const maxBudget = 320
  const sizeByWidth = (maxBudget - GAP * (columns - 1)) / columns
  const cellSize = Math.max(16, Math.min(CELL_BASE, sizeByWidth))

  const occupied = useMemo(() => {
    const set = new Set<string>()
    for (const b of otherButtons ?? []) {
      const rs = Math.max(1, b.rowSpan ?? 1)
      const cs = Math.max(1, b.colSpan ?? 1)
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) {
          set.add(key(b.row + dr, b.column + dc))
        }
      }
    }
    return set
  }, [otherButtons])

  // The effective "anchor" is either the fixed anchor (anchored mode) or the
  // first cell of the current selection (unanchored mode).
  const effectiveAnchor: { row: number; column: number } | null = anchored
    ? { row: anchorRow!, column: anchorColumn! }
    : value
      ? { row: value.row, column: value.column }
      : null

  const inPreview = (r: number, c: number) => {
    if (!value) return false
    return (
      r >= value.row &&
      r < value.row + value.rowSpan &&
      c >= value.column &&
      c < value.column + value.colSpan
    )
  }

  const isAnchorCell = (r: number, c: number) =>
    effectiveAnchor !== null && r === effectiveAnchor.row && c === effectiveAnchor.column

  const rectFree = (r1: number, c1: number, r2: number, c2: number) => {
    for (let rr = r1; rr <= r2; rr++) {
      for (let cc = c1; cc <= c2; cc++) {
        if (occupied.has(key(rr, cc))) return false
      }
    }
    return true
  }

  const handlePress = (r: number, c: number) => {
    if (occupied.has(key(r, c))) return // never let the user land on an occupied cell

    if (anchored) {
      const aR = anchorRow!
      const aC = anchorColumn!
      if (r < aR || c < aC) return
      if (!rectFree(aR, aC, r, c)) return
      onChange({ row: aR, column: aC, rowSpan: r - aR + 1, colSpan: c - aC + 1 })
      return
    }

    // Unanchored, two-step flow.
    if (!value) {
      // First tap → pick anchor.
      onChange({ row: r, column: c, rowSpan: 1, colSpan: 1 })
      return
    }

    if (r === value.row && c === value.column) {
      // Tap on the anchor again → clear the selection.
      onChange(null)
      return
    }

    if (r >= value.row && c >= value.column) {
      // Second tap below/right of anchor → set bottom-right.
      if (!rectFree(value.row, value.column, r, c)) return
      onChange({
        row: value.row,
        column: value.column,
        rowSpan: r - value.row + 1,
        colSpan: c - value.column + 1,
      })
      return
    }

    // Tap above or left of current anchor → re-anchor here.
    onChange({ row: r, column: c, rowSpan: 1, colSpan: 1 })
  }

  return (
    <View style={themed($container)}>
      <View style={themed($grid)}>
        {Array.from({ length: rows }).map((_, r) => (
          <View key={r} style={themed($row)}>
            {Array.from({ length: columns }).map((_, c) => {
              const isOccupied = occupied.has(key(r, c))
              const isAnchor = isAnchorCell(r, c)
              const previewed = inPreview(r, c)
              const reachable = anchored ? r >= anchorRow! && c >= anchorColumn! : true
              const disabled = isOccupied || (anchored && !reachable)

              let bg = theme.colors.background
              let border = theme.colors.border
              let borderWidth = 1

              if (isOccupied) {
                bg = "rgba(239,68,68,0.2)"
                border = theme.colors.error
              } else if (previewed) {
                bg = theme.colors.tint
                border = theme.colors.tint
              } else if (anchored && !reachable) {
                border = theme.colors.separator
              }

              if (isAnchor) {
                borderWidth = 2
                border = theme.colors.palette.neutral100
              }

              return (
                <Pressable
                  key={c}
                  disabled={disabled}
                  onPress={() => handlePress(r, c)}
                  style={({ pressed }) => [
                    {
                      width: cellSize,
                      height: cellSize,
                      marginRight: c < columns - 1 ? GAP : 0,
                      backgroundColor: bg,
                      borderColor: border,
                      borderWidth,
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    pressed && !disabled && { opacity: 0.7 },
                  ]}
                >
                  {isAnchor && (
                    <View
                      style={{
                        width: cellSize * 0.4,
                        height: cellSize * 0.4,
                        borderRadius: cellSize,
                        backgroundColor: theme.colors.palette.neutral100,
                      }}
                    />
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>

      <View style={themed($legend)}>
        {!!value && (
          <Legend
            swatch={theme.colors.tint}
            label={`${value.rowSpan} × ${value.colSpan} @ (${value.row + 1},${value.column + 1})`}
            bold
          />
        )}
        {!value && !anchored && (
          <Text style={themed($legendLabel)} text="Tap a cell to place the tile" />
        )}
        {!!otherButtons?.length && (
          <Legend swatch="rgba(239,68,68,0.4)" border={theme.colors.error} label="Taken" />
        )}
        {!anchored && !!value && (
          <Text
            style={themed($legendLabel)}
            text="Tap the marked cell to clear, or another cell for size."
          />
        )}
      </View>
    </View>
  )
}

const Legend: FC<{ swatch: string; border?: string; label: string; bold?: boolean }> = ({
  swatch,
  border,
  label,
  bold,
}) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($legendItem)}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          backgroundColor: swatch,
          borderColor: border ?? "transparent",
          borderWidth: border ? 1 : 0,
        }}
      />
      <Text style={[themed($legendLabel), bold && { fontWeight: "700" }]} text={label} />
    </View>
  )
}

function key(r: number, c: number): string {
  return `${r}:${c}`
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xs })
const $grid: ThemedStyle<ViewStyle> = () => ({ gap: GAP, alignSelf: "flex-start" })
const $row: ThemedStyle<ViewStyle> = () => ({ flexDirection: "row" })
const $legend: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.md,
  alignItems: "center",
})
const $legendItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})
const $legendLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 11 })
