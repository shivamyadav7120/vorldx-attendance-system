import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows } from "../theme/tokens";
import { useTheme } from "../context/ThemeContext";

export default function BottomTabBar({ activeTab, onSelectTab }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 18 : 8);

  let theme = null;
  try {
    theme = useTheme()?.wallpaper;
  } catch (e) {
    theme = null;
  }

  const barBg = theme?.surface || colors.bgWatery;
  const barBorder = theme?.cardBorder || colors.borderWatery;
  const activeColor = theme?.primary || colors.primary;
  const inactiveColor = theme?.textMuted || colors.textSecondary;
  const activeIconBg = theme?.isDark ? activeColor : colors.darkButton;
  const activeIconColor = theme?.isDark ? "#040915" : "#FFFFFF";

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: barBg,
          borderTopColor: barBorder,
          paddingBottom: bottomPadding,
        },
      ]}
    >
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
                  isActive && [
                    styles.activeIconContainer,
                    {
                      backgroundColor: activeIconBg,
                      shadowColor: activeColor,
                    },
                  ],
                ]}
              >
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={20}
                  color={isActive ? activeIconColor : inactiveColor}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? activeColor : inactiveColor,
                    fontWeight: isActive ? "800" : "600",
                  },
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
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingTop: 8,
    borderTopWidth: 1,
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
    width: 42,
    height: 32,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
