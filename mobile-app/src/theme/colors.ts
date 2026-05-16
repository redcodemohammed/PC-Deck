import { MD3LightTheme } from "react-native-paper"

const paper = MD3LightTheme.colors

const palette = {
  neutral100: paper.surface,
  neutral200: paper.surfaceVariant,
  neutral300: paper.outlineVariant,
  neutral400: paper.outline,
  neutral500: paper.onSurfaceVariant,
  neutral600: paper.onSurfaceVariant,
  neutral700: paper.inverseSurface,
  neutral800: paper.onSurface,
  neutral900: paper.onBackground,

  primary100: paper.primaryContainer,
  primary200: paper.primaryContainer,
  primary300: paper.primary,
  primary400: paper.primary,
  primary500: paper.primary,
  primary600: paper.inversePrimary,

  secondary100: paper.secondaryContainer,
  secondary200: paper.secondaryContainer,
  secondary300: paper.secondary,
  secondary400: paper.secondary,
  secondary500: paper.secondary,

  accent100: paper.tertiaryContainer,
  accent200: paper.tertiaryContainer,
  accent300: paper.tertiary,
  accent400: paper.tertiary,
  accent500: paper.tertiary,

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
