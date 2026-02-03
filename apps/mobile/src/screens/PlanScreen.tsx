import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Strategy, StoredCard } from "@ccpp/shared/mobile";
import type { PlanAction } from "@ccpp/shared/ai";
import { ConstraintViolationError } from "@ccpp/solver";

import { listCards } from "../data/cards";
import { getPlanPreferences, setPlanPreferences } from "../data/preferences";
import { getLatestPlanSnapshot, savePlanSnapshot } from "../data/planSnapshots";
import { buildPlanSnapshot } from "../logic/plan";
import { Button } from "../components/Button";
import { Disclaimer } from "../components/Disclaimer";
import { EmptyState } from "../components/EmptyState";
import { Field } from "../components/Field";
import { PlanActionRow } from "../components/PlanActionRow";
import { Section } from "../components/Section";
import { StrategySelector } from "../components/StrategySelector";
import { colors, spacing } from "../theme";
import { formatCurrency, formatCentsPlain, parseCurrencyToCents } from "../utils/format";
import type { RootStackParamList } from "../navigation/types";

export function PlanScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cards, setCards] = React.useState<StoredCard[]>([]);
  const [availableCash, setAvailableCash] = React.useState("");
  const [strategy, setStrategy] = React.useState<Strategy>("utilization");
  const [plan, setPlan] = React.useState<Awaited<
    ReturnType<typeof getLatestPlanSnapshot>
  > | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showOnTrack, setShowOnTrack] = React.useState(false);

  const refresh = React.useCallback(() => {
    setLoading(true);
    Promise.all([listCards(), getPlanPreferences(), getLatestPlanSnapshot()])
      .then(([cardsData, prefs, latestPlan]) => {
        setCards(cardsData);
        setAvailableCash(formatCentsPlain(prefs.availableCashCents));
        setStrategy(prefs.strategy);
        setPlan(latestPlan);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleGenerate = async () => {
    setError(null);
    const cashCents = parseCurrencyToCents(availableCash);
    if (cashCents == null) {
      setError("Enter a valid available cash amount.");
      return;
    }

    try {
      const snapshot = buildPlanSnapshot(cards, cashCents, strategy);
      await setPlanPreferences(cashCents, strategy);
      await savePlanSnapshot(snapshot);
      setPlan(snapshot);
    } catch (err: unknown) {
      if (err instanceof ConstraintViolationError) {
        const payload = err.getPayload();
        setError(
          `Available cash is short by ${formatCurrency(
            payload.shortfallCents
          )}. Cover minimums first or reduce cash constraints.`
        );
      } else {
        setError("Plan generation failed. Please try again.");
      }
    }
  };

  if (!loading && cards.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Add your first card"
          description="This screen will show a cycle-specific payment plan once you add a card."
          action={
            <Button
              label="Add Card"
              onPress={() => navigation.navigate("CardForm")}
            />
          }
        />
      </View>
    );
  }

  const actions = ((plan?.snapshot.actions ?? []) as PlanAction[]).filter(
    (action) => action.amountCents > 0
  );
  const actionCardIds = new Set(actions.map((action) => action.cardId));
  const onTrackCards = cards.filter((card) => !actionCardIds.has(card.id));
  const focusSummary = (plan?.snapshot.focusSummary ?? []) as string[];
  const noActionNeededToday = plan != null && actions.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="This Cycle">
        <Field
          label="Available cash this cycle ($)"
          value={availableCash}
          onChangeText={setAvailableCash}
          keyboardType="decimal-pad"
          error={error ?? undefined}
        />
        <Text style={styles.subtle}>
          Enter how much you can pay total. Minimum payments are always
          prioritized.
        </Text>
        <View style={styles.spacer} />
        <Text style={styles.label}>Strategy</Text>
        <StrategySelector value={strategy} onChange={setStrategy} />
        <View style={styles.spacer} />
        <Button label="Generate Plan" onPress={handleGenerate} />
      </Section>

      {plan ? (
        <Section title="Summary">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total payments</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(plan.totalPaymentCents)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Actions</Text>
            <Text style={styles.summaryValue}>{actions.length}</Text>
          </View>
          {focusSummary.length > 0 ? (
            <View style={styles.focusBox}>
              {focusSummary.map((line: string) => (
                <Text key={line} style={styles.focusText}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={styles.spacer} />
          <Button
            label="Why this plan"
            variant="secondary"
            onPress={() => navigation.navigate("WhyPlan")}
          />
        </Section>
      ) : null}

      <Section title="Needs Attention">
        {actions.length === 0 ? (
          <EmptyState
            title={noActionNeededToday ? "No action needed today" : "No actions yet"}
            description={
              noActionNeededToday
                ? "Your plan shows no urgent payments due today."
                : "Generate a plan to see recommendations."
            }
          />
        ) : (
          actions.map((action) => (
            <PlanActionRow
              key={`${action.cardId}-${action.targetDate}-${action.amountCents}`}
              action={action}
            />
          ))
        )}
      </Section>

      {onTrackCards.length > 0 ? (
        <Section
          title="On Track"
          action={
            <Pressable onPress={() => setShowOnTrack((prev) => !prev)}>
              <Text style={styles.toggle}>
                {showOnTrack ? "Hide" : "Show"}
              </Text>
            </Pressable>
          }
        >
          {showOnTrack ? (
            onTrackCards.map((card) => (
              <View key={card.id} style={styles.onTrackRow}>
                <Text style={styles.onTrackName}>{card.name}</Text>
                <Text style={styles.onTrackMeta}>
                  Balance {formatCurrency(card.currentBalanceCents)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.subtle}>
              {onTrackCards.length} card
              {onTrackCards.length === 1 ? "" : "s"} require no action right now.
            </Text>
          )}
        </Section>
      ) : null}

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
  label: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  subtle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  spacer: {
    height: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    color: colors.muted,
  },
  summaryValue: {
    color: colors.text,
    fontWeight: "600",
  },
  focusBox: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    backgroundColor: colors.card,
  },
  focusText: {
    fontSize: 12,
    color: colors.text,
  },
  toggle: {
    color: colors.accent,
    fontWeight: "600",
  },
  onTrackRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  onTrackName: {
    fontSize: 14,
    color: colors.text,
  },
  onTrackMeta: {
    fontSize: 12,
    color: colors.muted,
  },
});
