import { MD3DarkTheme } from "react-native-paper"

const paper = MD3DarkTheme.colors

const palette = {
  neutral900: paper.onBackground,
  neutral800: paper.onSurface,
  neutral700: paper.inverseSurface,
  neutral600: paper.onSurfaceVariant,
  neutral500: paper.onSurfaceVariant,
  neutral400: paper.outline,
  neutral300: paper.outlineVariant,
  neutral200: paper.surfaceVariant,
  neutral100: paper.surface,

  primary600: paper.inversePrimary,
  primary500: paper.primary,
  primary400: paper.primary,
  primary300: paper.primary,
  primary200: paper.primaryContainer,
  primary100: paper.primaryContainer,

  secondary500: paper.secondary,
  secondary400: paper.secondary,
  secondary300: paper.secondary,
  secondary200: paper.secondaryContainer,
  secondary100: paper.secondaryContainer,

  accent500: paper.tertiary,
  accent400: paper.tertiary,
  accent300: paper.tertiary,
  accent200: paper.tertiaryContainer,
  accent100: paper.tertiaryContainer,

  angry100: paper.errorContainer,
  angry500: paper.error,

  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay50: "rgba(0, 0, 0, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: paper.onBackground,
  textDim: paper.onSurfaceVariant,
  background: paper.background,
  border: paper.outline,
  tint: paper.primary,
  tintInactive: paper.outlineVariant,
  separator: paper.outlineVariant,
  error: paper.error,
  errorBackground: paper.errorContainer,
} as const
