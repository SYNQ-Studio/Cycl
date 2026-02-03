import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  type PressableStateCallbackType,
} from "react-native";
import { colors, radius, spacing } from "../theme";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  disabled?: boolean;
};

const variantStyles: Record<ButtonVariant, { background: string; text: string }> =
  {
    primary: { background: colors.accent, text: "#FFFFFF" },
    secondary: { background: colors.card, text: colors.text },
    danger: { background: colors.danger, text: "#FFFFFF" },
  };

export function Button({
  label,
  onPress,
  variant = "primary",
  style,
  disabled = false,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.base,
        {
          backgroundColor: variantStyle.background,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: variantStyle.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
