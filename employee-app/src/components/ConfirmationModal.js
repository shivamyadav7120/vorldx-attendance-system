import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, shadows } from "../theme/tokens";
import DarkButton from "./DarkButton";

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
  icon = "alert-circle-outline",
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, shadows.card]}>
              <View
                style={[
                  styles.iconCircle,
                  isDanger ? styles.dangerCircle : styles.infoCircle,
                ]}
              >
                <Ionicons
                  name={icon}
                  size={28}
                  color={isDanger ? "#DC2626" : colors.primary}
                />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.buttonRow}>
                <DarkButton
                  title={cancelLabel}
                  variant="secondary"
                  onPress={onCancel}
                  style={styles.actionBtn}
                  disabled={loading}
                />
                <DarkButton
                  title={confirmLabel}
                  variant={isDanger ? "danger" : "primary"}
                  onPress={onConfirm}
                  loading={loading}
                  style={styles.actionBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderWatery,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  infoCircle: {
    backgroundColor: colors.bgWateryDeep,
    borderWidth: 1,
    borderColor: colors.bgWateryGlow,
  },
  dangerCircle: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
  },
});
