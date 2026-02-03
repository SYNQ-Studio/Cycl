import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StoredCard } from "@ccpp/shared/mobile";
import { colors, radius, spacing } from "../theme";
import { formatCurrency } from "../utils/format";

type CardRowProps = {
  card: StoredCard;
  onPress: () => void;
};

export function CardRow({ card, onPress }: CardRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{card.name}</Text>
        <Text style={styles.balance}>
          {formatCurrency(card.currentBalanceCents)}
        </Text>
      </View>
      <Text style={styles.meta}>
        Limit {formatCurrency(card.creditLimitCents)} • Due day {card.dueDateDay}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  balance: {
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 12,
  },
});
