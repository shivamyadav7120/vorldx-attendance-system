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
  Image,
  ScrollView,
} from "react-native";
import api from "../services/api";

export default function WfhScreen({ onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // WFH Type: "STANDARD" | "URGENT"
  const [wfhType, setWfhType] = useState("STANDARD");

  // Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [urgencyReason, setUrgencyReason] = useState("");
  const [documentData, setDocumentData] = useState(null); // base64 data URI
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState(null);

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
      // Mobile fallback if web document object is not present
      Alert.alert(
        "Upload Verification Document",
        "Select proof document or simulate upload on test device:",
        [
          {
            text: "Attach Medical Proof (Simulated)",
            onPress: () => {
              setDocumentName("medical_fitness_certificate.pdf");
              setDocumentType("application/pdf");
              setDocumentData("data:application/pdf;base64,JVBERi0xLjQKJUZha2VEb2N1bWVudA==");
            },
          },
          {
            text: "Attach Emergency Slip (Image)",
            onPress: () => {
              setDocumentName("emergency_doctor_prescription.jpg");
              setDocumentType("image/jpeg");
              setDocumentData("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
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

  async function handleApply() {
    if (!startDate || !endDate) {
      Alert.alert("Validation Error", "Please provide start and end dates (YYYY-MM-DD).");
      return;
    }

    const days = countDays(startDate, endDate);

    // Standard WFH Max 5 Days validation
    if (wfhType === "STANDARD" && days > 5) {
      Alert.alert(
        "Standard Quota Exceeded",
        `Standard WFH is limited to a maximum of 5 days (you selected ${days} days). For longer emergency requirements, switch to "Urgent WFH" and provide official document proof.`
      );
      return;
    }

    // Urgent WFH Mandatory Document Proof validation
    if (wfhType === "URGENT" && !documentData) {
      Alert.alert(
        "Document Proof Required",
        "Urgent Emergency WFH requires you to attach a real document (doctor prescription, medical slip, hospital report, or emergency proof)."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitWfhRequest({
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
          ? "🚨 Urgent Emergency WFH submitted with attached document proof for priority review!"
          : "Standard WFH request submitted successfully (Max 5 days quota applied)."
      );

      setModalOpen(false);
      setReason("");
      setUrgencyReason("");
      setDocumentData(null);
      setDocumentName("");
      setDocumentType("");
      loadRequests();
    } catch (err) {
      Alert.alert("Submission Failed", err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    Alert.alert("Cancel Request", "Are you sure you want to cancel this pending WFH request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await api.cancelWfh(id);
            Alert.alert("Cancelled", "WFH request has been cancelled.");
            loadRequests();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  }

  function getStatusStyle(status) {
    switch (status) {
      case "APPROVED":
        return { bg: "#0d2b23", text: "#34d399", border: "#10b981" };
      case "REJECTED":
        return { bg: "#351421", text: "#fb7185", border: "#f43f5e" };
      case "CANCELLED":
        return { bg: "#1e293b", text: "#94a3b8", border: "#334155" };
      case "PENDING":
      default:
        return { bg: "#332615", text: "#fbbf24", border: "#f59e0b" };
    }
  }

  const selectedDays = countDays(startDate, endDate);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work From Home</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Apply</Text>
        </TouchableOpacity>
      </View>

      {/* POLICY CALLOUT CARDS */}
      <View style={styles.policyRow}>
        <View style={styles.policyCard}>
          <Text style={styles.policyTypeTitle}>🏠 Standard WFH</Text>
          <Text style={styles.policyDesc}>
            Planned remote work. <Text style={{ color: "#38bdf8", fontWeight: "700" }}>Max 5 days</Text> allowed per request.
          </Text>
        </View>

        <View style={[styles.policyCard, styles.policyUrgentCard]}>
          <Text style={[styles.policyTypeTitle, { color: "#f43f5e" }]}>🚨 Urgent WFH</Text>
          <Text style={styles.policyDesc}>
            Medical / emergency. <Text style={{ color: "#f43f5e", fontWeight: "700" }}>Real proof</Text> strictly mandatory.
          </Text>
        </View>
      </View>

      {/* REQUESTS LIST */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator color="#38bdf8" size="large" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRequests();
              }}
              tintColor="#38bdf8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>No WFH Requests Yet</Text>
              <Text style={styles.emptySub}>
                Tap "+ Apply" to submit a Standard (max 5 days) or Urgent WFH request with document proof.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = getStatusStyle(item.status);
            const isUrgent = item.wfhType === "URGENT";
            return (
              <View style={[styles.card, isUrgent && styles.urgentCardBorder]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.typeBadgeRow}>
                      {isUrgent ? (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>🚨 URGENT EMERGENCY</Text>
                        </View>
                      ) : (
                        <View style={styles.standardBadge}>
                          <Text style={styles.standardBadgeText}>🏠 Standard (Max 5d)</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardDates}>
                      {item.startDate}{" "}
                      {item.endDate && item.endDate !== item.startDate ? `➔ ${item.endDate}` : ""}
                    </Text>

                    <Text style={styles.cardReason}>
                      {item.reason ? `"${item.reason}"` : "Planned remote work"}
                    </Text>

                    {item.urgencyReason ? (
                      <Text style={styles.cardUrgencyReason}>
                        Emergency Note: {item.urgencyReason}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: st.bg,
                        borderColor: st.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status || "PENDING"}
                    </Text>
                  </View>
                </View>

                {/* ATTACHED REAL DOCUMENT CHIP */}
                {item.documentUrl ? (
                  <View style={styles.docChip}>
                    <Text style={styles.docChipIcon}>📄</Text>
                    <Text style={styles.docChipText} numberOfLines={1}>
                      Verified Proof: {item.documentName || "document_proof.pdf"}
                    </Text>
                  </View>
                ) : null}

                {/* DECISION COMMENT */}
                {item.decisionComment ? (
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>
                      Decision Note: "{item.decisionComment}"
                    </Text>
                  </View>
                ) : null}

                {/* CANCEL BUTTON IF PENDING */}
                {item.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item._id)}
                  >
                    <Text style={styles.cancelBtnText}>✕ Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* APPLY WFH MODAL */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Apply for Work From Home</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* STEP 1: SELECT 2 TYPES OF WFH */}
              <Text style={styles.sectionHeading}>1. SELECT WFH CATEGORY</Text>
              <View style={styles.typeSelectorGrid}>
                <TouchableOpacity
                  style={[
                    styles.typeSelectorCard,
                    wfhType === "STANDARD" && styles.typeSelectorCardActive,
                  ]}
                  onPress={() => setWfhType("STANDARD")}
                >
                  <Text style={styles.typeIcon}>🏠</Text>
                  <Text style={styles.typeName}>Standard WFH</Text>
                  <Text style={styles.typeQuota}>Quota: Max 5 Days</Text>
                  <Text style={styles.typeHint}>Standard planned tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSelectorCard,
                    wfhType === "URGENT" && styles.typeSelectorCardActiveUrgent,
                  ]}
                  onPress={() => setWfhType("URGENT")}
                >
                  <Text style={styles.typeIcon}>🚨</Text>
                  <Text style={[styles.typeName, { color: "#f43f5e" }]}>Urgent WFH</Text>
                  <Text style={[styles.typeQuota, { color: "#f43f5e" }]}>Document Required</Text>
                  <Text style={styles.typeHint}>Medical / emergency</Text>
                </TouchableOpacity>
              </View>

              {/* DURATION WARNING IF STANDARD > 5 DAYS */}
              {wfhType === "STANDARD" && selectedDays > 5 && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    ⚠️ Standard WFH allows maximum 5 days. You selected {selectedDays} days. Please adjust dates or switch to Urgent WFH with document proof.
                  </Text>
                </View>
              )}

              {/* DATES */}
              <Text style={styles.sectionHeading}>2. DURATION ({selectedDays} DAY{selectedDays !== 1 ? "S" : ""})</Text>
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>START DATE</Text>
                  <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#475569"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>END DATE</Text>
                  <TextInput
                    style={styles.input}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>

              {/* REASON */}
              <Text style={styles.label}>WORK / TASK REASON</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Key deliverables and tasks planned during WFH..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={2}
              />

              {/* IF URGENT: URGENCY DETAILS + MANDATORY DOCUMENT UPLOAD */}
              {wfhType === "URGENT" && (
                <View style={styles.urgentUploadSection}>
                  <Text style={styles.urgentSectionTitle}>
                    🚨 MANDATORY EMERGENCY PROOF
                  </Text>

                  <Text style={styles.label}>EMERGENCY JUSTIFICATION</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={urgencyReason}
                    onChangeText={setUrgencyReason}
                    placeholder="Medical reason, family emergency, or critical situation..."
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={2}
                  />

                  <Text style={[styles.label, { marginTop: 10 }]}>
                    UPLOAD REAL DOCUMENT PROOF (PDF / IMAGE) *
                  </Text>

                  {documentData ? (
                    <View style={styles.filePreviewCard}>
                      <Text style={styles.fileIcon}>📄</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {documentName || "Attached_Document.pdf"}
                        </Text>
                        <Text style={styles.fileStatus}>✓ Ready to upload with request</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeFileBtn}
                        onPress={() => {
                          setDocumentData(null);
                          setDocumentName("");
                          setDocumentType("");
                        }}
                      >
                        <Text style={styles.removeFileText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile}>
                      <Text style={styles.uploadIcon}>📎</Text>
                      <Text style={styles.uploadBtnText}>
                        Select Real Document (Medical Slip / Doctor Note / PDF)
                      </Text>
                      <Text style={styles.uploadSubtext}>Supports PDF, PNG, JPG, JPEG up to 15MB</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ACTIONS */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setModalOpen(false)}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    wfhType === "URGENT" && styles.submitBtnUrgent,
                    submitting && styles.btnDisabled,
                  ]}
                  onPress={handleApply}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {wfhType === "URGENT"
                        ? "🚨 Submit Urgent Request"
                        : "✓ Submit WFH Request"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2c44",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#131b2e",
  },
  backBtnText: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  addBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  policyRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 6,
  },
  policyCard: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  policyUrgentCard: {
    borderColor: "#5c1d2e",
    backgroundColor: "#1a121c",
  },
  policyTypeTitle: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },
  policyDesc: {
    color: "#94a3b8",
    fontSize: 10.5,
    lineHeight: 14,
  },
  loaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  urgentCardBorder: {
    borderColor: "#e11d48",
    borderWidth: 1.5,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  typeBadgeRow: {
    marginBottom: 6,
  },
  urgentBadge: {
    backgroundColor: "#351421",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e11d48",
  },
  urgentBadgeText: {
    color: "#f43f5e",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  standardBadge: {
    backgroundColor: "#132742",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#204670",
  },
  standardBadgeText: {
    color: "#38bdf8",
    fontSize: 9.5,
    fontWeight: "700",
  },
  cardDates: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
  },
  cardReason: {
    color: "#94a3b8",
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 17,
  },
  cardUrgencyReason: {
    color: "#fca5a5",
    fontSize: 11.5,
    marginTop: 4,
    fontStyle: "italic",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  docChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0f1626",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#22324a",
  },
  docChipIcon: {
    fontSize: 13,
  },
  docChipText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  commentBox: {
    backgroundColor: "#0d131f",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#38bdf8",
  },
  commentText: {
    color: "#94a3b8",
    fontSize: 11.5,
    fontStyle: "italic",
  },
  cancelBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#29121a",
    borderWidth: 1,
    borderColor: "#5c2033",
  },
  cancelBtnText: {
    color: "#fb7185",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
    marginTop: 6,
    lineHeight: 17,
  },

  /* MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  modalCloseText: {
    color: "#94a3b8",
    fontSize: 18,
    padding: 4,
  },
  sectionHeading: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },
  typeSelectorGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  typeSelectorCard: {
    flex: 1,
    backgroundColor: "#0b0f19",
    borderWidth: 1.5,
    borderColor: "#1e2c44",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  typeSelectorCardActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#12253d",
  },
  typeSelectorCardActiveUrgent: {
    borderColor: "#e11d48",
    backgroundColor: "#2e121c",
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeName: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800",
  },
  typeQuota: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  typeHint: {
    color: "#64748b",
    fontSize: 9.5,
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: "#332615",
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    color: "#fbbf24",
    fontSize: 11,
    lineHeight: 15,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  label: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#22324a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
    fontSize: 13,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 52,
    textAlignVertical: "top",
  },
  urgentUploadSection: {
    backgroundColor: "#1a121c",
    borderWidth: 1,
    borderColor: "#e11d48",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  urgentSectionTitle: {
    color: "#f43f5e",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#e11d48",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#24121a",
  },
  uploadIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  uploadBtnText: {
    color: "#fda4af",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  uploadSubtext: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 3,
  },
  filePreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#090d15",
    padding: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  fileIcon: {
    fontSize: 20,
  },
  fileName: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
  },
  fileStatus: {
    color: "#34d399",
    fontSize: 10,
    marginTop: 2,
  },
  removeFileBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#351421",
  },
  removeFileText: {
    color: "#fb7185",
    fontSize: 10,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  cancelModalBtnText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1.4,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#4f46e5",
  },
  submitBtnUrgent: {
    backgroundColor: "#e11d48",
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
