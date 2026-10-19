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

function MainNavigator() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("dashboard");

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#23c8f5" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

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

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: "#071728",
    justifyContent: "center",
    alignItems: "center",
  },
});
