import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { listCards } from "../data/cards";
import type { StoredCard } from "@ccpp/shared/mobile";
import { Button } from "../components/Button";
import { CardRow } from "../components/CardRow";
import { EmptyState } from "../components/EmptyState";
import { colors, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

export function CardsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cards, setCards] = React.useState<Awaited<
    ReturnType<typeof listCards>
  >>([]);
  const [loading, setLoading] = React.useState(true);

  const loadCards = React.useCallback(() => {
    setLoading(true);
    listCards()
      .then((data) => setCards(data))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          label="Add"
          variant="secondary"
          onPress={() => navigation.navigate("CardForm")}
        />
      ),
    });
  }, [navigation]);

  if (!loading && cards.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No cards yet"
          description="Add your first card to start planning payments."
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

  return (
    <View style={styles.container}>
      {loading ? <Text style={styles.muted}>Loading cards...</Text> : null}
      <FlatList<StoredCard>
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardRow
            card={item}
            onPress={() =>
              navigation.navigate("CardForm", { cardId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  muted: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
});
