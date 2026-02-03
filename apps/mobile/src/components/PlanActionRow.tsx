import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PlanAction } from "@ccpp/shared/ai";
import { colors, radius, spacing } from "../theme";
import { formatCurrency } from "../utils/format";

type PlanActionRowProps = {
  action: PlanAction;
};

export function PlanActionRow({ action }: PlanActionRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{action.cardName}</Text>
        <Text style={styles.amount}>{formatCurrency(action.amountCents)}</Text>
      </View>
      <Text style={styles.meta}>
        {action.actionType === "BEFORE_STATEMENT_CLOSE"
          ? "Before statement close"
          : "By due date"}{" "}
        • {action.targetDate}
      </Text>
      <Text style={styles.reason}>{action.reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  amount: {
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
  reason: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.text,
  },
});
