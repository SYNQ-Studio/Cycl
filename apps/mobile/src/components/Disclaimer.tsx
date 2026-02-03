import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

const DISCLAIMER_TEXT =
  "Informational only. No payments are executed. No guarantees. Verify issuer terms.";

export function Disclaimer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: "#FFF9F2",
  },
  text: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 16,
  },
});
