import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import WateryCard from "../components/WateryCard";
import DarkButton from "../components/DarkButton";
import StatusBadge from "../components/StatusBadge";
import ConfirmationModal from "../components/ConfirmationModal";
import { useTheme } from "../context/ThemeContext";

export default function WfhScreen({ onBack }) {
  const { wallpaper } = useTheme();
  const [activeTab, setActiveTab] = useState("MY_REQUESTS");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [wfhType, setWfhType] = useState("STANDARD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [urgencyReason, setUrgencyReason] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  async function loadRequests() {
    try {
      const res = await api.getMyWfhRequests();
      setRequests(res.requests || []);
    } catch (e) {
      console.error("Failed to load WFH requests:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function handlePickFile() {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf";
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select a file smaller than 15MB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setDocumentName(file.name);
          setDocumentType(file.type || "application/pdf");
          setDocumentData(event.target.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      Alert.alert(
        "Attach Verification Document",
        "Select proof document or simulate upload on test device:",
        [
          {
            text: "Attach Medical Proof (PDF)",
            onPress: () => {
              setDocumentName("medical_fitness_certificate.pdf");
              setDocumentType("application/pdf");
              setDocumentData("data:application/pdf;base64,JVBERi0xLjQKJUZha2VEb2N1bWVudA==");
            },
          },
          {
            text: "Attach Emergency Slip (Image)",
            onPress: () => {
              setDocumentName("emergency_slip.jpg");
              setDocumentType("image/jpeg");
              setDocumentData(
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
              );
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  }

  function countDays(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }

  const selectedDays = countDays(startDate, endDate);

  async function handleApply() {
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please provide start and end dates (YYYY-MM-DD).");
      return;
    }

    if (wfhType === "STANDARD" && selectedDays > 5) {
      Alert.alert(
        "Standard Policy Limit Exceeded",
        `Standard WFH requests are limited to 5 days maximum. You selected ${selectedDays} days.\n\nSelect "Exceptional / Extended WFH" if you have a medical or emergency justification.`
      );
      return;
    }

    if (wfhType === "EXCEPTIONAL" && !urgencyReason.trim()) {
      Alert.alert(
        "Urgency Justification Required",
        "Exceptional WFH requests (>5 days) require a detailed reason explaining the emergency or medical need for HR & Admin review."
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: wfhType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
        urgencyReason: wfhType === "EXCEPTIONAL" ? urgencyReason.trim() : undefined,
        documentData: documentData || undefined,
        documentName: documentName || undefined,
        documentType: documentType || undefined,
      };

      await api.submitWfhRequest(payload);
      Alert.alert(
        "Application Submitted",
        wfhType === "EXCEPTIONAL"
          ? "Exceptional WFH request submitted. HR Admin and Super Admin will review your documentation."
          : "Standard WFH request submitted. You will be notified once reviewed."
      );
      setActiveTab("MY_REQUESTS");
      setStartDate("");
      setEndDate("");
      setReason("");
      setUrgencyReason("");
      setDocumentData(null);
      setDocumentName("");
      loadRequests();
    } catch (err) {
      Alert.alert("Submission Failed", err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function executeCancel() {
    if (!cancelTargetId) return;
    setCancelling(true);
    try {
      await api.cancelWfh(cancelTargetId);
      setCancelTargetId(null);
      Alert.alert("Success", "WFH request has been cancelled.");
      loadRequests();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={[styles.backBtn, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={wallpaper?.textPrimary || colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, wallpaper && { color: wallpaper.textPrimary }]}>Work From Home</Text>
          <Text style={[styles.headerSubtitle, wallpaper && { color: wallpaper.textSecondary }]}>Remote attendance and approvals</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIconBtn, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
          onPress={() => {
            setRefreshing(true);
            loadRequests();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={wallpaper?.primary || colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "MY_REQUESTS" && (wallpaper?.isDark
              ? { backgroundColor: wallpaper.primary }
              : styles.tabButtonActive),
          ]}
          onPress={() => setActiveTab("MY_REQUESTS")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === "MY_REQUESTS" ? (wallpaper?.isDark ? "#040915" : "#FFFFFF") : (wallpaper?.textSecondary || colors.textSecondary)}
          />
          <Text
            style={[
              styles.tabText,
              wallpaper && { color: wallpaper.textSecondary },
              activeTab === "MY_REQUESTS" && {
                color: wallpaper?.isDark ? "#040915" : "#FFFFFF",
                fontWeight: "900",
              },
            ]}
          >
            My Requests ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "APPLY" && (wallpaper?.isDark
              ? { backgroundColor: wallpaper.primary }
              : styles.tabButtonActive),
          ]}
          onPress={() => setActiveTab("APPLY")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={activeTab === "APPLY" ? (wallpaper?.isDark ? "#040915" : "#FFFFFF") : (wallpaper?.textSecondary || colors.textSecondary)}
          />
          <Text
            style={[
              styles.tabText,
              wallpaper && { color: wallpaper.textSecondary },
              activeTab === "APPLY" && {
                color: wallpaper?.isDark ? "#040915" : "#FFFFFF",
                fontWeight: "900",
              },
            ]}
          >
            Apply for WFH
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "MY_REQUESTS" ? (
        loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator color={wallpaper?.primary || colors.primary} size="large" />
            <Text style={[styles.loadingText, wallpaper && { color: wallpaper.textSecondary }]}>Loading WFH requests...</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadRequests();
                }}
                tintColor={wallpaper?.primary || colors.primary}
              />
            }
            ListEmptyComponent={
              <WateryCard style={styles.emptyCard}>
                <Ionicons name="laptop-outline" size={44} color={wallpaper?.primary || colors.primary} />
                <Text style={[styles.emptyTitle, wallpaper && { color: wallpaper.textPrimary }]}>No WFH Requests</Text>
                <Text style={[styles.emptySub, wallpaper && { color: wallpaper.textSecondary }]}>
                  You haven't submitted any remote attendance requests yet. Use the "Apply for WFH" tab above to request remote work days.
                </Text>
              </WateryCard>
            }
            renderItem={({ item }) => {
              const startFormatted = new Date(item.startDate).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const endFormatted = new Date(item.endDate).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const isPending = item.status === "PENDING" || item.status === "HR_APPROVED";
              const isExceptional = item.type === "EXCEPTIONAL" || (item.daysRequested && item.daysRequested > 5);

              return (
                <WateryCard style={styles.requestCard} elevated>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBlock}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <View style={[styles.wfhTypeBadge, isExceptional && styles.wfhTypeBadgeExceptional]}>
                          <Text style={[styles.wfhTypeBadgeText, isExceptional && styles.wfhTypeBadgeTextExceptional]}>
                            {isExceptional ? "EXCEPTIONAL (>5 DAYS)" : "STANDARD WFH"}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.dateRange, wallpaper && { color: wallpaper.textPrimary }]}>
                        {startFormatted === endFormatted ? startFormatted : `${startFormatted} → ${endFormatted}`}
                      </Text>
                      <Text style={[styles.daysCount, wallpaper && { color: wallpaper.textSecondary }]}>
                        {item.daysRequested || 1} day{(item.daysRequested || 1) > 1 ? "s" : ""} requested
                      </Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  {item.reason ? (
                    <Text style={[styles.reasonText, wallpaper && { color: wallpaper.textSecondary }]}>{item.reason}</Text>
                  ) : null}

                  {item.urgencyReason ? (
                    <View style={[styles.urgencyBox, wallpaper && { backgroundColor: wallpaper.surfaceWatery }]}>
                      <Ionicons name="medical" size={14} color="#EF4444" />
                      <Text style={[styles.urgencyText, wallpaper && { color: wallpaper.textSecondary }]}>
                        <Text style={{ fontWeight: "700" }}>Justification: </Text>
                        {item.urgencyReason}
                      </Text>
                    </View>
                  ) : null}

                  {item.documentData && (
                    <TouchableOpacity
                      style={[styles.docPreviewButton, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}
                      onPress={() => setPreviewDoc(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="attach" size={16} color={wallpaper?.primary || colors.primary} />
                      <Text style={[styles.docPreviewText, wallpaper && { color: wallpaper.primary }]}>
                        {item.documentName || "Attached Proof Document"}
                      </Text>
                      <Ionicons name="eye-outline" size={14} color={wallpaper?.primary || colors.primary} />
                    </TouchableOpacity>
                  )}

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelAction}
                      onPress={() => setCancelTargetId(item._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.cancelActionText}>Cancel Request</Text>
                    </TouchableOpacity>
                  )}
                </WateryCard>
              );
            }}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <WateryCard style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Ionicons name="shield-checkmark" size={18} color={wallpaper?.primary || colors.primary} />
              <Text style={[styles.policyTitle, wallpaper && { color: wallpaper.primary }]}>VorldX WFH Remote Policy</Text>
            </View>
            <Text style={[styles.policyItem, wallpaper && { color: wallpaper.textSecondary }]}>
              • Standard WFH allowance: Up to 5 consecutive business days per request.
            </Text>
            <Text style={[styles.policyItem, wallpaper && { color: wallpaper.textSecondary }]}>
              • Extended requests (>5 days) require "Exceptional" classification with justification & verification proof.
            </Text>
            <Text style={[styles.policyItem, wallpaper && { color: wallpaper.textSecondary }]}>
              • Remote check-in via dashboard GPS/Wi-Fi is enabled on approved days.
            </Text>
          </WateryCard>

          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>REQUEST CLASSIFICATION</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder },
                  wfhType === "STANDARD" && [styles.typeOptionActive, wallpaper?.isDark && { backgroundColor: wallpaper.primary, borderColor: wallpaper.primary }],
                ]}
                onPress={() => setWfhType("STANDARD")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={wfhType === "STANDARD" ? (wallpaper?.isDark ? "#040915" : colors.textPrimary) : (wallpaper?.textSecondary || colors.textSecondary)}
                />
                <Text style={[
                  styles.typeOptionText,
                  wallpaper && { color: wallpaper.textSecondary },
                  wfhType === "STANDARD" && { color: wallpaper?.isDark ? "#040915" : colors.textPrimary, fontWeight: "900" },
                ]}>
                  Standard (≤ 5 Days)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder },
                  wfhType === "EXCEPTIONAL" && [styles.typeOptionActive, wallpaper?.isDark && { backgroundColor: wallpaper.primary, borderColor: wallpaper.primary }],
                ]}
                onPress={() => setWfhType("EXCEPTIONAL")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="medical-outline"
                  size={16}
                  color={wfhType === "EXCEPTIONAL" ? (wallpaper?.isDark ? "#040915" : colors.textPrimary) : (wallpaper?.textSecondary || colors.textSecondary)}
                />
                <Text style={[
                  styles.typeOptionText,
                  wallpaper && { color: wallpaper.textSecondary },
                  wfhType === "EXCEPTIONAL" && { color: wallpaper?.isDark ? "#040915" : colors.textPrimary, fontWeight: "900" },
                ]}>
                  Exceptional (> 5 Days)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateCol}>
              <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>START DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
                ]}
                placeholder="2026-10-25"
                placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
                value={startDate}
                onChangeText={setStartDate}
                maxLength={10}
              />
            </View>

            <View style={styles.dateCol}>
              <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>END DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
                ]}
                placeholder="2026-10-29"
                placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
                value={endDate}
                onChangeText={setEndDate}
                maxLength={10}
              />
            </View>
          </View>

          {selectedDays > 0 && (
            <View style={[styles.durationBadgeRow, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}>
              <Ionicons name="time-outline" size={16} color={wallpaper?.primary || colors.primary} />
              <Text style={[styles.durationBadgeText, wallpaper && { color: wallpaper.textSecondary }]}>
                Duration: <Text style={{ fontWeight: "700", color: wallpaper?.textPrimary || colors.textPrimary }}>{selectedDays} calendar day{selectedDays > 1 ? "s" : ""}</Text>
                {wfhType === "STANDARD" && selectedDays > 5 && (
                  <Text style={{ color: "#EF4444", fontWeight: "700" }}> — Exceeds 5-day standard policy!</Text>
                )}
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>WORK PLAN / SCOPE OF WORK</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
              ]}
              placeholder="Key project deliverables and availability plan during remote days"
              placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </View>

          {wfhType === "EXCEPTIONAL" && (
            <>
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>
                  EMERGENCY / MEDICAL JUSTIFICATION <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textArea,
                    wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
                  ]}
                  placeholder="Detail the medical condition, relocation, or emergency reason requiring >5 days remote"
                  placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
                  value={urgencyReason}
                  onChangeText={setUrgencyReason}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>ATTACH VERIFICATION DOCUMENT / MEDICAL SLIP</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadBox,
                    wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.primary },
                  ]}
                  onPress={handlePickFile}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={documentData ? "document-attach" : "cloud-upload-outline"}
                    size={28}
                    color={wallpaper?.primary || colors.primary}
                  />
                  <Text style={[styles.uploadTitle, wallpaper && { color: wallpaper.textPrimary }]}>
                    {documentName ? documentName : "Tap to Attach Proof Document"}
                  </Text>
                  <Text style={[styles.uploadSubtitle, wallpaper && { color: wallpaper.textMuted }]}>
                    {documentName ? "Tap to change attached file" : "Supports PDF or Images (max 15MB)"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <DarkButton
            title="Submit WFH Application"
            onPress={handleApply}
            loading={submitting}
            style={{ marginTop: spacing.md }}
            icon={<Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />}
          />
        </ScrollView>
      )}

      <ConfirmationModal
        visible={Boolean(cancelTargetId)}
        title="Cancel WFH Request"
        message="Are you sure you want to cancel this remote work request? This action cannot be undone."
        confirmText="Yes, Cancel Request"
        cancelText="Keep Request"
        danger
        loading={cancelling}
        onConfirm={executeCancel}
        onCancel={() => setCancelTargetId(null)}
      />

      <Modal visible={Boolean(previewDoc)} transparent animationType="fade">
        <View style={styles.docModalBackdrop}>
          <View style={[styles.docModalBox, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}>
            <View style={styles.docModalHeader}>
              <Text style={[styles.docModalTitle, wallpaper && { color: wallpaper.textPrimary }]}>
                {previewDoc?.documentName || "Attached Document"}
              </Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                <Ionicons name="close" size={24} color={wallpaper?.textPrimary || colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.docModalBody}>
              {previewDoc?.documentType?.includes("image") ? (
                <Image
                  source={{ uri: previewDoc.documentData }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.docFileFallback}>
                  <Ionicons name="document-text" size={48} color={wallpaper?.primary || colors.primary} />
                  <Text style={[styles.docFallbackName, wallpaper && { color: wallpaper.textPrimary }]}>
                    {previewDoc?.documentName}
                  </Text>
                  <Text style={[styles.docFallbackNote, wallpaper && { color: wallpaper.textSecondary }]}>
                    Document verified and attached for HR / Super Admin compliance audit.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radii.md,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.darkButton,
    ...shadows.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  requestCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  dateBlock: {
    flex: 1,
  },
  wfhTypeBadge: {
    backgroundColor: colors.bgWateryDeep,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  wfhTypeBadgeExceptional: {
    backgroundColor: "#FEE2E2",
  },
  wfhTypeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  wfhTypeBadgeTextExceptional: {
    color: "#DC2626",
  },
  dateRange: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  daysCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  urgencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: 8,
    gap: 6,
  },
  urgencyText: {
    fontSize: 12,
    color: "#991B1B",
    flex: 1,
  },
  docPreviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
    alignSelf: "flex-start",
  },
  docPreviewText: {
    fontSize: 11.5,
    color: colors.primaryDark,
    fontWeight: "600",
  },
  cancelAction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 5,
    alignSelf: "flex-start",
  },
  cancelActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  formScroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  policyCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  policyItem: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  typeOptionActive: {
    borderColor: colors.darkButton,
    backgroundColor: colors.surfaceWatery,
  },
  typeOptionText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.textPrimary,
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  durationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    gap: 6,
  },
  durationBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  uploadBox: {
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1.5,
    borderColor: colors.borderWateryActive,
    borderStyle: "dashed",
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 6,
    textAlign: "center",
  },
  uploadSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  docModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  docModalBox: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  docModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  docModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  docModalBody: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  previewImage: {
    width: "100%",
    height: 300,
  },
  docFileFallback: {
    alignItems: "center",
    padding: 24,
  },
  docFallbackName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
  },
  docFallbackNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
