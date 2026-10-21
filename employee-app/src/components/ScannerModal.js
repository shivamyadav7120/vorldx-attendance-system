import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows } from "../theme/tokens";
import DarkButton from "./DarkButton";

export default function ScannerModal({ visible, onClose, onScan, scanning }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [enableTorch, setEnableTorch] = useState(false);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Floating Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Office QR Scanner</Text>
            <Text style={styles.subtitle}>Hold steady to verify check-in</Text>
          </View>

          <TouchableOpacity
            style={[styles.circleButton, enableTorch && styles.circleButtonActive]}
            onPress={() => setEnableTorch((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={enableTorch ? "flash" : "flash-outline"}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Camera Surface */}
        {!permission ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.messageText}>Requesting camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerMessage}>
            <Ionicons name="camera-outline" size={48} color={colors.primary} />
            <Text style={styles.permissionHeading}>Camera Access Needed</Text>
            <Text style={styles.messageText}>
              Camera permission is required to scan the rolling office attendance QR code.
            </Text>
            <DarkButton
              title="Grant Camera Access"
              onPress={requestPermission}
              style={{ marginTop: 20 }}
            />
            <DarkButton
              title="Close Scanner"
              variant="secondary"
              onPress={onClose}
              style={{ marginTop: 10 }}
            />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing={facing}
            enableTorch={enableTorch}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              scanning
                ? undefined
                : (result) => {
                    if (result && result.data) {
                      onScan(result.data);
                    }
                  }
            }
          >
            {/* Dark Mask with Transparent Reticle */}
            <View style={styles.overlayContainer}>
              <View style={styles.maskTop} />
              
              <View style={styles.reticleRow}>
                <View style={styles.maskSide} />
                <View style={styles.reticleFrame}>
                  {/* Four Corner Reticles */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {scanning ? (
                    <View style={styles.processingBadge}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.processingText}>Verifying QR...</Text>
                    </View>
                  ) : (
                    <View style={styles.laserLine} />
                  )}
                </View>
                <View style={styles.maskSide} />
              </View>

              <View style={styles.maskBottom}>
                <View style={styles.guideCard}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                  <Text style={styles.guideText}>
                    18-second rolling dynamic encryption active
                  </Text>
                </View>
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 24,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.borderWateryActive,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  camera: {
    flex: 1,
  },
  centerMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: colors.bgWatery,
  },
  permissionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  overlayContainer: {
    flex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.7)",
  },
  reticleRow: {
    flexDirection: "row",
    height: 270,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.7)",
  },
  reticleFrame: {
    width: 270,
    height: 270,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#38BDF8",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  laserLine: {
    width: "88%",
    height: 2,
    backgroundColor: "#38BDF8",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  processingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  maskBottom: {
    flex: 1.2,
    backgroundColor: "rgba(11, 15, 25, 0.7)",
    alignItems: "center",
    paddingTop: 30,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  guideText: {
    color: "#E0F2FE",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
});
