import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import WfhScreen from "./src/screens/WfhScreen";
import LeaveScreen from "./src/screens/LeaveScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BottomTabBar from "./src/components/BottomTabBar";
import WallpaperBackground from "./src/components/WallpaperBackground";

function MainNavigator() {
  const { user, loading } = useAuth();
  const { wallpaper } = useTheme();
  const [currentScreen, setCurrentScreen] = useState("dashboard");

  if (loading) {
    return (
      <WallpaperBackground style={styles.centerContainer}>
        <ActivityIndicator size="large" color={wallpaper.primary} />
      </WallpaperBackground>
    );
  }

  if (!user) {
    return (
      <WallpaperBackground style={styles.root}>
        <StatusBar style={wallpaper.statusBar} />
        <LoginScreen />
      </WallpaperBackground>
    );
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
    <WallpaperBackground style={styles.root}>
      <StatusBar style={wallpaper.statusBar} />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.screenArea}>{renderScreen()}</View>
        <BottomTabBar activeTab={currentScreen} onSelectTab={setCurrentScreen} />
      </SafeAreaView>
    </WallpaperBackground>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  screenArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
