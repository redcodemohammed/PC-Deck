import { FC, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import type { ClockWidgetConfig } from "@/services/pcdeck"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ClockWidgetProps {
  config: ClockWidgetConfig
  width: number
  height: number
}

function format(date: Date, cfg: ClockWidgetConfig): { time: string; date: string } {
  const showSeconds = !!cfg.showSeconds
  const hour12 = (cfg.format ?? "24h") === "12h"
  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12,
  })
  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return { time, date: day }
}

export const ClockWidget: FC<ClockWidgetProps> = ({ config, width, height }) => {
  const { themed } = useAppTheme()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = config.showSeconds ? 1000 : 30_000
    const id = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(id)
  }, [config.showSeconds])

  const { time, date } = format(now, config)
  const fontSize = Math.min(width / Math.max(4, time.length * 0.5), height * 0.55)

  return (
    <View style={themed($container)}>
      <Text style={[themed($time), { fontSize }]} text={time} />
      {config.showDate && <Text style={themed($date)} text={date} />}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
})
const $time: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "700",
  letterSpacing: 2,
})
const $date: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  opacity: 0.8,
  fontSize: 12,
  marginTop: 4,
})
