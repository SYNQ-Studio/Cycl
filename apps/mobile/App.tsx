import "react-native-gesture-handler";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { initDb } from "./src/data/db";
import { CardsScreen } from "./src/screens/CardsScreen";
import { CardFormScreen } from "./src/screens/CardFormScreen";
import { PlanScreen } from "./src/screens/PlanScreen";
import { WhyPlanScreen } from "./src/screens/WhyPlanScreen";
import { colors } from "./src/theme";
import type { RootStackParamList, TabsParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.card },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Cards" component={CardsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    initDb()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize database", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
            headerTintColor: colors.text,
          }}
        >
          <Stack.Screen
            name="Tabs"
            component={Tabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CardForm"
            component={CardFormScreen}
            options={({ route }) => ({
              title: route.params?.cardId ? "Edit Card" : "Add Card",
            })}
          />
          <Stack.Screen name="WhyPlan" component={WhyPlanScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
