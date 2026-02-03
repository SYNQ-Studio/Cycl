import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Strategy } from "@ccpp/shared/mobile";
import { colors, radius, spacing } from "../theme";

const STRATEGIES: { value: Strategy; label: string; detail: string }[] = [
  {
    value: "utilization",
    label: "Utilization",
    detail: "Reduce reported balances before statement close.",
  },
  {
    value: "avalanche",
    label: "Avalanche",
    detail: "Highest APR first after minimums.",
  },
  {
    value: "snowball",
    label: "Snowball",
    detail: "Smallest balance first after minimums.",
  },
];

type StrategySelectorProps = {
  value: Strategy;
  onChange: (value: Strategy) => void;
};

export function StrategySelector({ value, onChange }: StrategySelectorProps) {
  return (
    <View style={styles.container}>
      {STRATEGIES.map((strategy) => {
        const selected = strategy.value === value;
        return (
          <Pressable
            key={strategy.value}
            onPress={() => onChange(strategy.value)}
            style={[
              styles.option,
              selected ? styles.optionSelected : null,
            ]}
          >
            <Text style={[styles.label, selected ? styles.labelSelected : null]}>
              {strategy.label}
            </Text>
            <Text style={styles.detail}>{strategy.detail}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: "#EEF4F2",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  labelSelected: {
    color: colors.accent,
  },
  detail: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
});
