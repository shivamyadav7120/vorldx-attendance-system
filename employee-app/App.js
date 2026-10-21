import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import WfhScreen from "./src/screens/WfhScreen";
import LeaveScreen from "./src/screens/LeaveScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BottomTabBar from "./src/components/BottomTabBar";
import { colors } from "./src/theme/tokens";

function MainNavigator() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("dashboard");

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  function renderScreen() {
    switch (currentScreen) {
      case "history":
        return <HistoryScreen onBack={() => setCurrentScreen("dashboard")} />;
      case "wfh":
        return <WfhScreen onBack={() => setCurrentScreen("dashboard")} />;
      case "leave":
        return <LeaveScreen onBack={() => setCurrentScreen("dashboard")} />;
      case "profile":
        return <ProfileScreen onBack={() => setCurrentScreen("dashboard")} />;
      case "dashboard":
      default:
        return <DashboardScreen onNavigate={setCurrentScreen} />;
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.screenArea}>{renderScreen()}</View>
      <BottomTabBar activeTab={currentScreen} onSelectTab={setCurrentScreen} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgWatery,
  },
  screenArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bgWatery,
    justifyContent: "center",
    alignItems: "center",
  },
});
