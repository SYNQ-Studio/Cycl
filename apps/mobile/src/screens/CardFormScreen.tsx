import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CardInput } from "@ccpp/shared/mobile";

import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { colors, spacing } from "../theme";
import { createCard, deleteCard, getCard, updateCard } from "../data/cards";
import { formatAprBps, formatCentsPlain, parseAprToBps, parseCurrencyToCents, parseDayOfMonth } from "../utils/format";
import type { RootStackParamList } from "../navigation/types";

type CardFormRoute = RouteProp<RootStackParamList, "CardForm">;
type CardFormNav = NativeStackNavigationProp<RootStackParamList, "CardForm">;

type FormState = {
  name: string;
  issuer: string;
  creditLimit: string;
  balance: string;
  minimumPayment: string;
  apr: string;
  statementCloseDay: string;
  dueDateDay: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  issuer: "",
  creditLimit: "",
  balance: "",
  minimumPayment: "",
  apr: "",
  statementCloseDay: "",
  dueDateDay: "",
};

export function CardFormScreen() {
  const navigation = useNavigation<CardFormNav>();
  const route = useRoute<CardFormRoute>();
  const cardId = route.params?.cardId;

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!cardId) {
      setForm(emptyForm);
      return;
    }
    getCard(cardId).then((card) => {
      if (!card) return;
      setForm({
        name: card.name,
        issuer: card.issuer ?? "",
        creditLimit: formatCentsPlain(card.creditLimitCents),
        balance: formatCentsPlain(card.currentBalanceCents),
        minimumPayment: formatCentsPlain(card.minimumPaymentCents),
        apr: formatAprBps(card.aprBps),
        statementCloseDay: String(card.statementCloseDay),
        dueDateDay: String(card.dueDateDay),
      });
    });
  }, [cardId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setErrors({});

    const creditLimitCents = parseCurrencyToCents(form.creditLimit);
    const balanceCents = parseCurrencyToCents(form.balance);
    const minimumCents = parseCurrencyToCents(form.minimumPayment);
    const aprBps = parseAprToBps(form.apr);
    const statementCloseDay = parseDayOfMonth(form.statementCloseDay);
    const dueDateDay = parseDayOfMonth(form.dueDateDay);

    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Card name is required.";
    if (creditLimitCents == null) nextErrors.creditLimit = "Enter a valid limit.";
    if (balanceCents == null) nextErrors.balance = "Enter a valid balance.";
    if (minimumCents == null)
      nextErrors.minimumPayment = "Enter a valid minimum.";
    if (aprBps == null) nextErrors.apr = "Enter a valid APR.";
    if (statementCloseDay == null)
      nextErrors.statementCloseDay = "Enter a day 1–31.";
    if (dueDateDay == null) nextErrors.dueDateDay = "Enter a day 1–31.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      issuer: form.issuer.trim() || undefined,
      creditLimitCents: creditLimitCents ?? 0,
      currentBalanceCents: balanceCents ?? 0,
      minimumPaymentCents: minimumCents ?? 0,
      aprBps: aprBps ?? 0,
      statementCloseDay: statementCloseDay ?? 1,
      dueDateDay: dueDateDay ?? 1,
      excludeFromOptimization: false,
    };

    const parsed = CardInput.safeParse(payload);
    if (!parsed.success) {
      const zodErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "creditLimitCents") zodErrors.creditLimit = issue.message;
        if (key === "currentBalanceCents") zodErrors.balance = issue.message;
        if (key === "minimumPaymentCents")
          zodErrors.minimumPayment = issue.message;
      }
      setErrors(zodErrors);
      setLoading(false);
      return;
    }

    try {
      if (cardId) {
        await updateCard(cardId, parsed.data);
      } else {
        await createCard(parsed.data);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Save failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!cardId) return;
    Alert.alert("Delete card?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCard(cardId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field
        label="Card name"
        value={form.name}
        onChangeText={(value) => updateField("name", value)}
        error={errors.name}
      />
      <Field
        label="Issuer (optional)"
        value={form.issuer}
        onChangeText={(value) => updateField("issuer", value)}
      />
      <Field
        label="Credit limit ($)"
        value={form.creditLimit}
        onChangeText={(value) => updateField("creditLimit", value)}
        keyboardType="decimal-pad"
        error={errors.creditLimit}
      />
      <Field
        label="Current balance ($)"
        value={form.balance}
        onChangeText={(value) => updateField("balance", value)}
        keyboardType="decimal-pad"
        error={errors.balance}
      />
      <Field
        label="Minimum payment ($)"
        value={form.minimumPayment}
        onChangeText={(value) => updateField("minimumPayment", value)}
        keyboardType="decimal-pad"
        error={errors.minimumPayment}
      />
      <Field
        label="APR (%)"
        value={form.apr}
        onChangeText={(value) => updateField("apr", value)}
        keyboardType="decimal-pad"
        error={errors.apr}
      />
      <Field
        label="Statement close day (1–31)"
        value={form.statementCloseDay}
        onChangeText={(value) => updateField("statementCloseDay", value)}
        keyboardType="number-pad"
        error={errors.statementCloseDay}
      />
      <Field
        label="Due date day (1–31)"
        value={form.dueDateDay}
        onChangeText={(value) => updateField("dueDateDay", value)}
        keyboardType="number-pad"
        error={errors.dueDateDay}
      />
      <View style={styles.actions}>
        <Button
          label={loading ? "Saving..." : cardId ? "Save Changes" : "Add Card"}
          onPress={handleSave}
          disabled={loading}
        />
        {cardId ? (
          <View style={styles.actionSpacer}>
            <Button
              label="Delete Card"
              onPress={handleDelete}
              variant="danger"
            />
          </View>
        ) : null}
      </View>
      <Text style={styles.note}>
        All fields are manually entered. Update balances each cycle for the most
        accurate plan.
      </Text>
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
  actions: {
    marginTop: spacing.md,
  },
  actionSpacer: {
    marginTop: spacing.sm,
  },
  note: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
