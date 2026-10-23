import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows } from "../theme/tokens";

export default function BottomTabBar({ activeTab, onSelectTab }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 18 : 8);
  const tabs = [
    {
      id: "dashboard",
      label: "Home",
      iconActive: "home",
      iconInactive: "home-outline",
    },
    {
      id: "history",
      label: "Attendance",
      iconActive: "calendar",
      iconInactive: "calendar-outline",
    },
    {
      id: "wfh",
      label: "WFH",
      iconActive: "laptop",
      iconInactive: "laptop-outline",
    },
    {
      id: "leave",
      label: "Leave",
      iconActive: "document-text",
      iconInactive: "document-text-outline",
    },
    {
      id: "profile",
      label: "Profile",
      iconActive: "person",
      iconInactive: "person-outline",
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={20}
                  color={isActive ? colors.darkButtonText : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgWatery,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderWatery,
    ...shadows.tabBar,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 2,
  },
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: colors.darkButton,
    shadowColor: colors.darkButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    color: colors.darkButton,
    fontWeight: "700",
  },
  inactiveTabLabel: {
    color: colors.textSecondary,
  },
});
