import { FC, ReactNode, useMemo } from "react"
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  type MD3Theme,
} from "react-native-paper"

import { useAppTheme } from "./context"

interface PaperThemeBridgeProps {
  children: ReactNode
}

/** Wraps children in a PaperProvider whose Material 3 theme is derived from the
 *  ignite app theme. Place inside `ThemeProvider` so it can read the active
 *  ignite theme via `useAppTheme()`. */
export const PaperThemeBridge: FC<PaperThemeBridgeProps> = ({ children }) => {
  const { theme, themeContext } = useAppTheme()

  const paperTheme: MD3Theme = useMemo(() => {
    const base = themeContext === "dark" ? MD3DarkTheme : MD3LightTheme
    const c = theme.colors
    const palette = c.palette
    const onTint = themeContext === "dark" ? palette.neutral100 : palette.neutral100
    return {
      ...base,
      // Force Paper to use system fonts to match the rest of the app (avoids the
      // jarring Roboto fallback on Android).
      colors: {
        ...base.colors,
        primary: c.tint,
        onPrimary: onTint,
        primaryContainer: palette.primary200,
        onPrimaryContainer: palette.neutral800,
        secondary: palette.secondary300,
        onSecondary: palette.neutral100,
        secondaryContainer: palette.secondary100,
        onSecondaryContainer: palette.neutral100,
        background: c.background,
        onBackground: c.text,
        surface: themeContext === "dark" ? palette.neutral300 : palette.neutral100,
        onSurface: c.text,
        surfaceVariant: themeContext === "dark" ? palette.neutral400 : palette.neutral200,
        onSurfaceVariant: c.textDim,
        outline: c.border,
        outlineVariant: c.separator,
        error: c.error,
        errorContainer: c.errorBackground,
        onError: palette.neutral100,
        onErrorContainer: c.error,
        elevation: {
          ...base.colors.elevation,
          level0: c.background,
          level1: themeContext === "dark" ? palette.neutral300 : palette.neutral100,
          level2: themeContext === "dark" ? palette.neutral400 : palette.neutral200,
        },
      },
      roundness: 8,
    }
  }, [theme, themeContext])

  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>
}
