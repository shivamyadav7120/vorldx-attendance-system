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
} from "react-native";
import api from "../services/api";

const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Unpaid", "Emergency"];

export default function LeaveScreen({ onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadRequests() {
    try {
      const res = await api.getMyLeaveRequests();
      setRequests(res.requests || []);
    } catch (e) {
      console.error("Failed to load Leave requests:", e);
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

  async function handleApply() {
    if (!startDate || !endDate) {
      Alert.alert("Error", "Please provide start and end dates (YYYY-MM-DD).");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitLeaveRequest(leaveType, startDate, endDate, reason);
      Alert.alert("Success", `${leaveType} leave request submitted!`);
      setModalOpen(false);
      setReason("");
      loadRequests();
    } catch (err) {
      Alert.alert("Submission Failed", err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    Alert.alert("Cancel Request", "Are you sure you want to cancel this pending leave request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await api.cancelLeave(id);
            Alert.alert("Cancelled", "Leave request has been cancelled.");
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
        return { bg: "rgba(46, 230, 202, 0.15)", text: "#2ee6ca", border: "#2ee6ca" };
      case "REJECTED":
        return { bg: "rgba(255, 92, 124, 0.15)", text: "#ff5c7c", border: "#ff5c7c" };
      case "CANCELLED":
        return { bg: "rgba(126, 155, 183, 0.15)", text: "#7e9bb7", border: "#7e9bb7" };
      case "PENDING":
      default:
        return { bg: "rgba(245, 166, 35, 0.15)", text: "#f5a623", border: "#f5a623" };
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Applications</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Apply</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator color="#23c8f5" size="large" />
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
              tintColor="#23c8f5"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Leave Requests</Text>
              <Text style={styles.emptySub}>
                Tap "+ Apply" to submit a casual, sick, or earned leave request.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = getStatusStyle(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.leaveType || "Leave"}</Text>
                    </View>
                    <Text style={styles.cardDates}>
                      {item.startDate} {item.endDate && item.endDate !== item.startDate ? `➔ ${item.endDate}` : ""}
                    </Text>
                    <Text style={styles.cardReason}>
                      {item.reason ? `"${item.reason}"` : "No reason specified"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: st.bg, borderColor: st.border },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status || "PENDING"}
                    </Text>
                  </View>
                </View>

                {item.decisionComment ? (
                  <View style={styles.decisionCommentBox}>
                    <Text style={styles.decisionCommentLabel}>Approver Note:</Text>
                    <Text style={styles.decisionCommentText}>"{item.decisionComment}"</Text>
                  </View>
                ) : null}

                {item.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item._id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel request</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* APPLICATION MODAL */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Apply For Leave</Text>

            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={styles.leaveTypeRow}>
              {LEAVE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    leaveType === type && styles.typeChipSelected,
                  ]}
                  onPress={() => setLeaveType(type)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      leaveType === type && styles.typeChipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#5a7b9d"
            />

            <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#5a7b9d"
            />

            <Text style={styles.inputLabel}>Reason / Remarks</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top" }]}
              value={reason}
              onChangeText={setReason}
              placeholder="State the reason for your leave request"
              placeholderTextColor="#5a7b9d"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                onPress={handleApply}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#071728" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Application</Text>
                )}
              </TouchableOpacity>
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
  loaderCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 18,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#172338",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#253b5e",
  },
  typeBadgeText: {
    color: "#38bdf8",
    fontSize: 11,
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
    fontStyle: "italic",
    maxWidth: 220,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  decisionCommentBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#0b0f19",
    borderLeftWidth: 3,
    borderLeftColor: "#38bdf8",
  },
  decisionCommentLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  decisionCommentText: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  cancelBtnText: {
    color: "#f43f5e",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 6,
  },
  leaveTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1e2c44",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeChipSelected: {
    backgroundColor: "#172338",
    borderColor: "#38bdf8",
  },
  typeChipText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  typeChipTextSelected: {
    color: "#38bdf8",
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1e2c44",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#f8fafc",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  modalSubmitBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
