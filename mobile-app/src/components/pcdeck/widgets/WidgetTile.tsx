import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import type { WidgetConfig } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { ClockWidget } from "./ClockWidget"
import { NowPlayingWidget } from "./NowPlayingWidget"
import { SpotifyWidget } from "./SpotifyWidget"
import { WebsiteWidget } from "./WebsiteWidget"

interface WidgetTileProps {
  widget: WidgetConfig | null | undefined
  width: number
  height: number
}

export const WidgetTile: FC<WidgetTileProps> = ({ widget, width, height }) => {
  const { themed } = useAppTheme()
  if (!widget) {
    return (
      <View style={themed($empty)}>
        <Text style={themed($emptyText)} text="No widget configured" />
      </View>
    )
  }
  switch (widget.type) {
    case "clock":
      return <ClockWidget config={widget.config} width={width} height={height} />
    case "website":
      return <WebsiteWidget config={widget.config} width={width} height={height} />
    case "now_playing":
      return <NowPlayingWidget config={widget.config} width={width} height={height} />
    case "spotify":
      return <SpotifyWidget width={width} height={height} />
  }
}

const $empty: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
})
const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.7,
  fontSize: 11,
})
