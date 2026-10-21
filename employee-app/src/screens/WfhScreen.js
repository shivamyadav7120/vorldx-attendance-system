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

export default function WfhScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("MY_REQUESTS"); // "MY_REQUESTS" | "APPLY"
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // WFH Type: "STANDARD" | "URGENT"
  const [wfhType, setWfhType] = useState("STANDARD");

  // Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [urgencyReason, setUrgencyReason] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Cancel modal
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
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
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
        `Standard WFH is limited to 5 days per month (you selected ${selectedDays} days). For longer emergency requirements, switch to "Urgent WFH" and attach verified document proof.`
      );
      return;
    }

    if (wfhType === "URGENT" && !documentData) {
      Alert.alert(
        "Document Proof Required",
        "Urgent Emergency WFH requires you to attach supporting document proof (doctor prescription, hospital note, or emergency slip)."
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.submitWfhRequest({
        wfhType,
        startDate,
        endDate,
        reason: reason.trim(),
        urgencyReason: urgencyReason.trim(),
        documentData,
        documentName,
        documentType,
      });

      Alert.alert(
        "Request Submitted",
        wfhType === "URGENT"
          ? "Urgent Emergency WFH submitted with proof for immediate review."
          : "Standard WFH request submitted successfully."
      );

      // Reset
      setActiveTab("MY_REQUESTS");
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
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Work From Home</Text>
          <Text style={styles.headerSubtitle}>Remote attendance and approvals</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={() => {
            setRefreshing(true);
            loadRequests();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "MY_REQUESTS" && styles.tabButtonActive]}
          onPress={() => setActiveTab("MY_REQUESTS")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === "MY_REQUESTS" ? "#FFFFFF" : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === "MY_REQUESTS" && styles.tabTextActive]}
          >
            My Requests ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "APPLY" && styles.tabButtonActive]}
          onPress={() => setActiveTab("APPLY")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={activeTab === "APPLY" ? "#FFFFFF" : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "APPLY" && styles.tabTextActive]}>
            Apply for WFH
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "MY_REQUESTS" ? (
        loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading WFH requests...</Text>
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
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <WateryCard style={styles.emptyCard}>
                <Ionicons name="laptop-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No WFH Requests Yet</Text>
                <Text style={styles.emptySub}>
                  Apply for remote work using the "Apply for WFH" tab above.
                </Text>
              </WateryCard>
            }
            renderItem={({ item }) => {
              const isUrgent = item.wfhType === "URGENT";
              const isPending = item.status === "PENDING";

              return (
                <WateryCard style={styles.requestCard} elevated>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBlock}>
                      <View style={styles.typeBadge}>
                        <Ionicons
                          name={isUrgent ? "alert-circle" : "calendar-outline"}
                          size={12}
                          color={isUrgent ? "#B91C1C" : colors.primary}
                        />
                        <Text
                          style={[
                            styles.typeBadgeText,
                            { color: isUrgent ? "#B91C1C" : colors.primaryDark },
                          ]}
                        >
                          {isUrgent ? "URGENT WFH" : "STANDARD (MAX 5D)"}
                        </Text>
                      </View>
                      <Text style={styles.dateRange}>
                        {item.startDate} → {item.endDate}
                      </Text>
                      <Text style={styles.daysCount}>
                        Duration: {countDays(item.startDate, item.endDate)} day(s)
                      </Text>
                    </View>

                    <StatusBadge status={item.status} size="sm" />
                  </View>

                  <Text style={styles.reasonText}>
                    <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                      Reason:{" "}
                    </Text>
                    {item.reason || "No description provided."}
                  </Text>

                  {item.documentUrl && (
                    <TouchableOpacity
                      style={styles.documentRow}
                      onPress={() => setPreviewDoc(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="document-attach" size={16} color={colors.primary} />
                      <Text style={styles.documentRowText} numberOfLines={1}>
                        Attached Proof: {item.documentName || "Verification Document"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelAction}
                      onPress={() => setCancelTargetId(item._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.cancelActionText}>Cancel Pending Request</Text>
                    </TouchableOpacity>
                  )}
                </WateryCard>
              );
            }}
          />
        )
      ) : (
        /* APPLY FOR WFH FORM */
        <ScrollView contentContainerStyle={styles.formScroll}>
          {/* Policy Information Box */}
          <WateryCard style={styles.policyCard} tint>
            <View style={styles.policyHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={styles.policyTitle}>VorldX WFH Policy Rules</Text>
            </View>
            <Text style={styles.policyItem}>
              • Standard WFH allows up to 5 days per employee each month.
            </Text>
            <Text style={styles.policyItem}>
              • Urgent WFH requires verified document proof (medical or emergency).
            </Text>
            <Text style={styles.policyItem}>
              • Daily office-wide capacity limit of 5 remote approvals applies.
            </Text>
          </WateryCard>

          {/* Type Selector Tabs */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                wfhType === "STANDARD" && styles.typeOptionActive,
              ]}
              onPress={() => setWfhType("STANDARD")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="briefcase-outline"
                size={18}
                color={wfhType === "STANDARD" ? colors.darkButton : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  wfhType === "STANDARD" && styles.typeOptionTextActive,
                ]}
              >
                Standard (≤ 5 Days)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                wfhType === "URGENT" && styles.typeOptionActive,
              ]}
              onPress={() => setWfhType("URGENT")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="medical-outline"
                size={18}
                color={wfhType === "URGENT" ? "#DC2626" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  wfhType === "URGENT" && styles.typeOptionTextActive,
                ]}
              >
                Urgent / Medical Proof
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dates Row */}
          <View style={styles.dateInputsRow}>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>START DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-10-21"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>END DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2026-10-21"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Calculated Duration Badge */}
          <View style={styles.durationBadgeRow}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.durationBadgeText}>
              Selected Duration:{" "}
              <Text style={{ fontWeight: "800", color: colors.primaryDark }}>
                {selectedDays} Day(s)
              </Text>
            </Text>
          </View>

          {/* Reason Input */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>REASON FOR WORK FROM HOME</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="State the purpose of your remote work arrangement..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Document Upload for Urgent WFH */}
          {wfhType === "URGENT" && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>SUPPORTING PROOF DOCUMENT (REQUIRED)</Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handlePickFile}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={documentData ? "checkmark-circle" : "cloud-upload-outline"}
                  size={26}
                  color={documentData ? "#15803D" : colors.primary}
                />
                <Text style={styles.uploadTitle}>
                  {documentName || "Tap to select prescription / emergency document"}
                </Text>
                <Text style={styles.uploadSubtitle}>Supports PDF, JPG, PNG up to 15MB</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* High-Contrast Dark Submit Button */}
          <DarkButton
            title={
              wfhType === "URGENT"
                ? "Submit Urgent WFH Request"
                : "Submit Standard WFH Request"
            }
            onPress={handleApply}
            loading={submitting}
            icon={<Ionicons name="send" size={17} color="#FFFFFF" />}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      )}

      {/* Confirmation Modal for Request Cancellation */}
      <ConfirmationModal
        visible={Boolean(cancelTargetId)}
        title="Cancel WFH Request?"
        message="This pending remote work request will be cancelled immediately."
        confirmLabel="Yes, Cancel"
        isDanger
        loading={cancelling}
        onConfirm={executeCancel}
        onCancel={() => setCancelTargetId(null)}
      />

      {/* Document Preview Modal */}
      <Modal
        visible={Boolean(previewDoc)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={styles.docModalBackdrop}>
          <View style={styles.docModalBox}>
            <View style={styles.docModalHeader}>
              <Text style={styles.docModalTitle} numberOfLines={1}>
                {previewDoc?.documentName || "Attached Proof"}
              </Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.docModalBody}>
              {previewDoc?.documentUrl?.includes("image") ||
              previewDoc?.documentName?.match(/\.(jpg|jpeg|png)$/i) ? (
                <Image
                  source={{ uri: previewDoc.documentUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.docFileFallback}>
                  <Ionicons name="document-text" size={56} color={colors.primary} />
                  <Text style={styles.docFallbackName}>
                    {previewDoc?.documentName}
                  </Text>
                  <Text style={styles.docFallbackNote}>
                    Verified official document attached
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
    backgroundColor: colors.bgWatery,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surfaceWatery,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWatery,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.darkButton,
    borderColor: colors.darkButton,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
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
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
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
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgWateryDeep,
    padding: 8,
    borderRadius: radii.sm,
    marginTop: 10,
    gap: 6,
  },
  documentRowText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDark,
    flex: 1,
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
    marginBottom: spacing.lg,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.borderWatery,
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
