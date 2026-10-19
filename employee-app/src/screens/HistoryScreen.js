import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import api from "../services/api";

export default function HistoryScreen({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadHistory() {
    try {
      const res = await api.getMyAttendance();
      setRecords(res.attendance || []);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function getStatusStyle(status) {
    switch (status) {
      case "PRESENT":
        return { bg: "rgba(35, 200, 245, 0.15)", text: "#23c8f5", border: "#23c8f5" };
      case "LATE":
        return { bg: "rgba(245, 166, 35, 0.15)", text: "#f5a623", border: "#f5a623" };
      case "HALF_DAY":
        return { bg: "rgba(156, 140, 255, 0.15)", text: "#9c8cff", border: "#9c8cff" };
      case "ABSENT":
      default:
        return { bg: "rgba(255, 92, 124, 0.15)", text: "#ff5c7c", border: "#ff5c7c" };
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator color="#23c8f5" size="large" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHistory();
              }}
              tintColor="#23c8f5"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Attendance Records Yet</Text>
              <Text style={styles.emptySub}>
                Your check-ins and check-outs will be listed here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = getStatusStyle(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.cardDate}>{item.date}</Text>
                    <Text style={styles.cardMode}>
                      {item.mode === "OFFICE" ? "🏢 Office" : "🏠 Remote WFH"}
                      {item.checkInMethod ? ` (${item.checkInMethod})` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: st.bg, borderColor: st.border },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status || "PRESENT"}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeGrid}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>In</Text>
                    <Text style={styles.timeValue}>
                      {item.checkIn
                        ? new Date(item.checkIn).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>Out</Text>
                    <Text style={styles.timeValue}>
                      {item.checkOut
                        ? new Date(item.checkOut).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </Text>
                  </View>
                </View>

                {item.notes ? (
                  <Text style={styles.notesText}>Note: {item.notes}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
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
    marginBottom: 12,
  },
  cardDate: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
  },
  cardMode: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
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
  timeGrid: {
    flexDirection: "row",
    backgroundColor: "#0b0f19",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  timeBox: {
    flex: 1,
    alignItems: "center",
  },
  timeLabel: {
    color: "#64748b",
    fontSize: 11,
  },
  timeValue: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  notesText: {
    color: "#94a3b8",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
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
});
