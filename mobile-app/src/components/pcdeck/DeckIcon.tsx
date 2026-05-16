import { FC } from "react"
import { TextStyle } from "react-native"
import { Icon as PaperIcon } from "react-native-paper"

import { Text } from "@/components/Text"

interface DeckIconProps {
  /** Either an emoji ("▶️"), a Material Community icon prefixed `mdi:` ("mdi:play"), or empty. */
  name: string
  size: number
  color: string
}

const MDI_PREFIX = "mdi:"

/** Renders a deck icon — Material Community Icon when the name starts with `mdi:`,
 *  otherwise treats it as text (emoji). */
export const DeckIcon: FC<DeckIconProps> = ({ name, size, color }) => {
  if (!name) return null
  if (name.startsWith(MDI_PREFIX)) {
    return <PaperIcon source={name.slice(MDI_PREFIX.length)} size={size} color={color} />
  }
  const style: TextStyle = { fontSize: size, color, lineHeight: size }
  return <Text style={style} text={name} />
}

export function isMaterialIconName(name: string): boolean {
  return name.startsWith(MDI_PREFIX)
}
