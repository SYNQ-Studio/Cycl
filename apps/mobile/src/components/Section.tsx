import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

type SectionProps = {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function Section({ title, children, action }: SectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
});
