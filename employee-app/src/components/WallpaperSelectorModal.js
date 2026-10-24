import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function WallpaperSelectorModal({ visible, onClose }) {
  const { wallpaper, wallpapers, changeWallpaper, wallpaperId } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: wallpaper.surface,
              borderColor: wallpaper.cardBorder,
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: wallpaper.primaryGhost,
                    borderColor: wallpaper.cardBorderActive,
                  },
                ]}
              >
                <Ionicons name="color-palette-outline" size={20} color={wallpaper.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: wallpaper.textPrimary }]}>
                  Inside App Wallpapers
                </Text>
                <Text style={[styles.subtitle, { color: wallpaper.textSecondary }]}>
                  Choose your fluid ocean & mirror background theme
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: wallpaper.cardBorder }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color={wallpaper.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {wallpapers.map((item) => {
              const isSelected = item.id === wallpaperId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: item.baseBg,
                      borderColor: isSelected ? item.cardBorderActive : item.cardBorder,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    changeWallpaper(item.id);
                  }}
                >
                  <View style={styles.paletteRow}>
                    <View style={[styles.paletteDot, { backgroundColor: item.primary }]} />
                    <View style={[styles.paletteDot, { backgroundColor: item.primaryDark }]} />
                    <View style={[styles.paletteDot, { backgroundColor: item.cardBorderActive }]} />
                  </View>

                  <View style={styles.itemInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.itemName, { color: item.textPrimary }]}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.activePill, { backgroundColor: item.primary }]}>
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          <Text style={styles.activePillText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemTagline, { color: item.textSecondary }]}>
                      {item.tagline}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: wallpaper.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.applyButtonText,
                { color: wallpaper.isDark ? "#040915" : "#FFFFFF" },
              ]}
            >
              Apply & Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
    maxHeight: "84%",
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(148, 163, 184, 0.4)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  paletteRow: {
    flexDirection: "row",
    gap: 5,
  },
  paletteDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  itemInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: "800",
  },
  itemTagline: {
    fontSize: 11,
    lineHeight: 15,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  applyButton: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
