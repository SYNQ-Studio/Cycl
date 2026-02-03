import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../theme";

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "number-pad";
  onChangeText: (value: string) => void;
  error?: string;
};

export function Field({
  label,
  value,
  placeholder,
  keyboardType = "default",
  onChangeText,
  error,
}: FieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 12,
  },
});
