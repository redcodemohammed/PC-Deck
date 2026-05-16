import { ComponentType } from "react"
import {
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { Button as PaperButton } from "react-native-paper"

import { translate } from "@/i18n/translate"

import { TextProps } from "./Text"

type Presets = "default" | "filled" | "reversed"

export interface ButtonAccessoryProps {
  style: StyleProp<any>
  pressableState: PressableStateCallbackType
  disabled?: boolean
}

export interface ButtonProps extends PressableProps {
  tx?: TextProps["tx"]
  text?: TextProps["text"]
  txOptions?: TextProps["txOptions"]
  style?: StyleProp<ViewStyle>
  pressedStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  pressedTextStyle?: StyleProp<TextStyle>
  disabledTextStyle?: StyleProp<TextStyle>
  preset?: Presets
  RightAccessory?: ComponentType<ButtonAccessoryProps>
  LeftAccessory?: ComponentType<ButtonAccessoryProps>
  children?: React.ReactNode
  disabled?: boolean
  disabledStyle?: StyleProp<ViewStyle>
}

export function Button(props: ButtonProps) {
  const {
    tx,
    text,
    txOptions,
    style,
    pressedStyle,
    textStyle,
    pressedTextStyle,
    disabledTextStyle,
    children,
    RightAccessory,
    LeftAccessory,
    disabled,
    disabledStyle,
    preset = "default",
    onPress,
    onLongPress,
    accessibilityLabel,
    testID,
  } = props

  void pressedStyle
  void pressedTextStyle

  const label = tx ? translate(tx, txOptions) : text
  const mode = preset === "default" ? "outlined" : "contained"
  const buttonColor = preset === "reversed" ? undefined : undefined
  const textColor = preset === "reversed" ? undefined : undefined

  return (
    <PaperButton
      accessibilityState={{ disabled: !!disabled }}
      mode={mode}
      buttonColor={buttonColor}
      textColor={textColor}
      disabled={disabled}
      style={[style, disabled && disabledStyle]}
      labelStyle={[textStyle, disabled && disabledTextStyle]}
      contentStyle={$content}
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {!!LeftAccessory && (
        <View style={$leftAccessory}>
          <LeftAccessory
            style={$accessory}
            pressableState={{ pressed: false }}
            disabled={disabled}
          />
        </View>
      )}
      {children ?? label}
      {!!RightAccessory && (
        <View style={$rightAccessory}>
          <RightAccessory
            style={$accessory}
            pressableState={{ pressed: false }}
            disabled={disabled}
          />
        </View>
      )}
    </PaperButton>
  )
}

const $content: ViewStyle = {
  minHeight: 44,
  paddingHorizontal: 4,
}

const $accessory: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $leftAccessory: ViewStyle = {
  marginRight: 8,
}

const $rightAccessory: ViewStyle = {
  marginLeft: 8,
}
