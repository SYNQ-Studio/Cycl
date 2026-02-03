import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { getLatestPlanSnapshot } from "../data/planSnapshots";
import { Disclaimer } from "../components/Disclaimer";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import { colors, spacing } from "../theme";
import { formatCurrency } from "../utils/format";

export function WhyPlanScreen() {
  const [plan, setPlan] = React.useState<Awaited<
    ReturnType<typeof getLatestPlanSnapshot>
  > | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      getLatestPlanSnapshot().then(setPlan);
    }, [])
  );

  if (!plan) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No plan yet"
          description="Generate a plan to see a clear explanation of this cycle’s priorities."
        />
      </View>
    );
  }

  const snapshot = plan.snapshot;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="What this plan is optimizing">
        <Text style={styles.body}>
          Minimum payments come first to prevent late fees. Next, we prioritize
          utilization before statement close dates. After that, we apply your
          selected strategy to distribute extra cash.
        </Text>
      </Section>

      <Section title="This cycle’s focus">
        {snapshot.focusSummary.length > 0 ? (
          snapshot.focusSummary.map((line: string) => (
            <Text key={line} style={styles.body}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={styles.body}>
            The current data shows no urgent actions beyond minimum payments.
          </Text>
        )}
      </Section>

      <Section title="Portfolio context">
        <View style={styles.row}>
          <Text style={styles.label}>Total payment</Text>
          <Text style={styles.value}>
            {formatCurrency(plan.totalPaymentCents)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Confidence</Text>
          <Text style={styles.value}>{snapshot.portfolio.confidence}</Text>
        </View>
      </Section>

      <Section title="Manual inputs">
        <Text style={styles.body}>
          All balances, limits, and dates are entered by you and treated as the
          source of truth. Updating them refreshes the plan immediately.
        </Text>
      </Section>

      <Disclaimer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
  },
  value: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
});
