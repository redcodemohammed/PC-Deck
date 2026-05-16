import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
  type MD3Theme,
} from "react-native-paper"
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from "@react-navigation/native"

import type { Theme } from "./types"

export function createPaperTheme(theme: Theme): MD3Theme {
  return theme.isDark ? MD3DarkTheme : MD3LightTheme
}

export function createNavigationTheme(paperTheme: MD3Theme, isDark: boolean) {
  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
    materialLight: paperTheme,
    materialDark: paperTheme,
  })

  return isDark ? DarkTheme : LightTheme
}
