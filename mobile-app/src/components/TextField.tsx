import { ComponentType, forwardRef, Ref } from "react"
import {
  ImageStyle,
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { HelperText, TextInput as PaperTextInput } from "react-native-paper"

import { isRTL } from "@/i18n"
import { translate } from "@/i18n/translate"

import { TextProps } from "./Text"

export interface TextFieldAccessoryProps {
  style: StyleProp<ViewStyle | TextStyle | ImageStyle>
  status: TextFieldProps["status"]
  multiline: boolean
  editable: boolean
}

export interface TextFieldProps extends Omit<TextInputProps, "ref"> {
  status?: "error" | "disabled"
  label?: TextProps["text"]
  labelTx?: TextProps["tx"]
  labelTxOptions?: TextProps["txOptions"]
  LabelTextProps?: TextProps
  helper?: TextProps["text"]
  helperTx?: TextProps["tx"]
  helperTxOptions?: TextProps["txOptions"]
  HelperTextProps?: TextProps
  placeholder?: TextProps["text"]
  placeholderTx?: TextProps["tx"]
  placeholderTxOptions?: TextProps["txOptions"]
  style?: StyleProp<TextStyle>
  containerStyle?: StyleProp<ViewStyle>
  inputWrapperStyle?: StyleProp<ViewStyle>
  RightAccessory?: ComponentType<TextFieldAccessoryProps>
  LeftAccessory?: ComponentType<TextFieldAccessoryProps>
}

export const TextField = forwardRef(function TextField(props: TextFieldProps, ref: Ref<TextInput>) {
  const {
    labelTx,
    label,
    labelTxOptions,
    placeholderTx,
    placeholder,
    placeholderTxOptions,
    helper,
    helperTx,
    helperTxOptions,
    status,
    RightAccessory,
    LeftAccessory,
    HelperTextProps,
    LabelTextProps,
    style,
    containerStyle,
    inputWrapperStyle,
    editable,
    multiline,
    selectionColor,
    ...textInputProps
  } = props

  const disabled = editable === false || status === "disabled"
  const labelContent = labelTx ? translate(labelTx, labelTxOptions) : label
  const helperContent = helperTx ? translate(helperTx, helperTxOptions) : helper
  const placeholderContent = placeholderTx
    ? translate(placeholderTx, placeholderTxOptions)
    : placeholder

  return (
    <View style={containerStyle}>
      <PaperTextInput
        ref={ref as never}
        mode="outlined"
        dense
        label={labelContent}
        placeholder={placeholderContent}
        error={status === "error"}
        disabled={disabled}
        multiline={multiline}
        textAlign={isRTL ? "right" : undefined}
        style={[style, multiline && $multiline]}
        outlineStyle={inputWrapperStyle}
        left={
          LeftAccessory ? (
            <PaperTextInput.Icon
              icon={() => (
                <LeftAccessory
                  style={$accessory}
                  status={status}
                  editable={!disabled}
                  multiline={multiline ?? false}
                />
              )}
            />
          ) : undefined
        }
        right={
          RightAccessory ? (
            <PaperTextInput.Icon
              icon={() => (
                <RightAccessory
                  style={$accessory}
                  status={status}
                  editable={!disabled}
                  multiline={multiline ?? false}
                />
              )}
            />
          ) : undefined
        }
        {...(textInputProps as any)}
        editable={!disabled}
      />
      {!!helperContent && (
        <HelperText
          type={status === "error" ? "error" : "info"}
          visible
          style={HelperTextProps?.style}
        >
          {helperContent}
        </HelperText>
      )}
      {!!LabelTextProps && null}
    </View>
  )
})

const $multiline: TextStyle = {
  minHeight: 112,
}

const $accessory: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}
