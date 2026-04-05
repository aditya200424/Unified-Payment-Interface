import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMerchant,
  getGetMerchantQueryKey,
  useReportFraud,
  getGetMerchantsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { TrustScoreDisplay } from "@/components/TrustScoreDisplay";

export default function MerchantDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { upiId } = useLocalSearchParams<{ upiId: string }>();
  const queryClient = useQueryClient();
  const [fraudModalVisible, setFraudModalVisible] = useState(false);
  const [fraudReason, setFraudReason] = useState("");
  const [reporterUpiId, setReporterUpiId] = useState("");
  const reportFraud = useReportFraud();

  const decodedUpiId = decodeURIComponent(upiId ?? "");

  const { data: merchant, isLoading, error } = useGetMerchant(decodedUpiId, {
    query: {
      enabled: !!decodedUpiId,
      queryKey: getGetMerchantQueryKey(decodedUpiId),
    },
  });

  const riskColor =
    merchant?.riskLevel === "Safe"
      ? colors.safe
      : merchant?.riskLevel === "Medium"
      ? colors.medium
      : colors.risky;

  const riskBg =
    merchant?.riskLevel === "Safe"
      ? colors.safeBackground
      : merchant?.riskLevel === "Medium"
      ? colors.mediumBackground
      : colors.riskyBackground;

  const handleReportFraud = async () => {
    if (!reporterUpiId.trim()) {
      Alert.alert("Error", "Please enter your UPI ID");
      return;
    }
    if (!fraudReason.trim()) {
      Alert.alert("Error", "Please describe the reason");
      return;
    }
    try {
      await reportFraud.mutateAsync({
        upiId: decodedUpiId,
        data: { reporterUpiId: reporterUpiId.trim(), reason: fraudReason.trim() },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      queryClient.invalidateQueries({ queryKey: getGetMerchantQueryKey(decodedUpiId) });
      queryClient.invalidateQueries({ queryKey: getGetMerchantsQueryKey() });
      setFraudModalVisible(false);
      setFraudReason("");
      setReporterUpiId("");
      Alert.alert("Reported", "Fraud report submitted. This will impact the trust score.");
    } catch (err: any) {
      Alert.alert("Error", err?.data?.error || "Failed to submit report.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !merchant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.risky} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Merchant not found
        </Text>
        <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
          {decodedUpiId}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_500Medium" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <Stack.Screen
        options={{
          title: merchant.name,
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Merchant header */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.merchantTitle}>
            <View style={styles.nameRow}>
              <Text style={[styles.merchantName, { color: colors.foreground }]}>
                {merchant.name}
              </Text>
              {merchant.isVerified && (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Feather name="check-circle" size={12} color={colors.primary} />
                  <Text style={[styles.verifiedText, { color: colors.primary }]}>
                    Verified
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.upiId, { color: colors.mutedForeground }]}>
              {merchant.upiId}
            </Text>
            <Text style={[styles.category, { color: colors.mutedForeground }]}>
              {merchant.category}
            </Text>
          </View>

          {/* Trust Score big display */}
          <View style={styles.scoreSection}>
            <TrustScoreDisplay score={merchant.trustScore} size="large" />
            <View
              style={[styles.riskBadge, { backgroundColor: riskBg }]}
            >
              <Text style={[styles.riskText, { color: riskColor }]}>
                {merchant.riskLevel.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.basedOn, { color: colors.mutedForeground }]}>
              Based on {merchant.totalTransactions.toLocaleString()} transactions
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatBlock
            label="Satisfaction"
            value={`${merchant.satisfactionPercent}%`}
            color={colors.safe}
            bg={colors.safeBackground}
            fg={colors.foreground}
            muted={colors.mutedForeground}
            card={colors.card}
            border={colors.border}
            radius={colors.radius}
          />
          <StatBlock
            label="Happy Txns"
            value={merchant.happyTransactions.toLocaleString()}
            color={colors.primary}
            bg={colors.muted}
            fg={colors.foreground}
            muted={colors.mutedForeground}
            card={colors.card}
            border={colors.border}
            radius={colors.radius}
          />
          <StatBlock
            label="Fraud Reports"
            value={merchant.fraudReports.toString()}
            color={merchant.fraudReports > 0 ? colors.risky : colors.mutedForeground}
            bg={merchant.fraudReports > 0 ? colors.riskyBackground : colors.muted}
            fg={colors.foreground}
            muted={colors.mutedForeground}
            card={colors.card}
            border={colors.border}
            radius={colors.radius}
          />
        </View>

        {/* Score formula */}
        <View
          style={[
            styles.formulaCard,
            { backgroundColor: colors.muted, borderRadius: colors.radius },
          ]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.formulaText, { color: colors.mutedForeground }]}>
            Trust Score = (Happy / Total) × 5 — minus fraud penalties
          </Text>
        </View>

        {/* Report Fraud */}
        <TouchableOpacity
          testID="button-report-fraud"
          onPress={() => setFraudModalVisible(true)}
          style={[styles.reportBtn, { borderColor: colors.risky, borderRadius: colors.radius }]}
        >
          <Feather name="flag" size={14} color={colors.risky} />
          <Text style={[styles.reportBtnText, { color: colors.risky }]}>
            Report Fraud
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PAY NOW floating button */}
      <View
        style={[
          styles.payBtnContainer,
          {
            paddingBottom: bottomPad + 16,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          testID="button-pay-now"
          onPress={() => router.push(`/merchant/${encodeURIComponent(decodedUpiId)}/pay`)}
          style={[
            styles.payBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
            Pay Now
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Fraud Report Modal */}
      <Modal
        visible={fraudModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFraudModalVisible(false)}
      >
        <View
          style={[styles.modal, { backgroundColor: colors.background }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Report Fraud
            </Text>
            <TouchableOpacity onPress={() => setFraudModalVisible(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            Reporting: {merchant.name} ({merchant.upiId})
          </Text>

          <Text style={[styles.modalLabel, { color: colors.foreground }]}>
            Your UPI ID
          </Text>
          <TextInput
            testID="input-reporter-upi"
            style={[
              styles.modalInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" },
            ]}
            placeholder="yourname@upi"
            placeholderTextColor={colors.mutedForeground}
            value={reporterUpiId}
            onChangeText={setReporterUpiId}
            autoCapitalize="none"
          />

          <Text style={[styles.modalLabel, { color: colors.foreground }]}>
            Reason
          </Text>
          <TextInput
            testID="input-fraud-reason"
            style={[
              styles.modalInput,
              styles.modalTextArea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" },
            ]}
            placeholder="Describe what happened..."
            placeholderTextColor={colors.mutedForeground}
            value={fraudReason}
            onChangeText={setFraudReason}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            testID="button-submit-fraud"
            onPress={handleReportFraud}
            disabled={reportFraud.isPending}
            style={[
              styles.reportSubmitBtn,
              { backgroundColor: colors.risky, borderRadius: colors.radius },
            ]}
          >
            {reportFraud.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.reportSubmitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function StatBlock({
  label, value, color, bg, fg, muted, card, border, radius
}: {
  label: string; value: string; color: string; bg: string;
  fg: string; muted: string; card: string; border: string; radius: number;
}) {
  return (
    <View style={[styles.statBlock, { backgroundColor: card, borderColor: border, borderRadius: radius }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  errorText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  errorSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  heroCard: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  merchantTitle: { marginBottom: 20 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  merchantName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  upiId: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  category: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreSection: { alignItems: "center", paddingVertical: 16 },
  riskBadge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  riskText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  basedOn: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statBlock: { flex: 1, borderWidth: 1, padding: 12, alignItems: "center" },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  formulaCard: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 16, padding: 12 },
  formulaText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, marginBottom: 20, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, justifyContent: "center" },
  reportBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  payBtnContainer: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  payBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modal: { flex: 1, padding: 24, paddingTop: 32 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 24 },
  modalLabel: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 8 },
  modalInput: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  modalTextArea: { height: 100, textAlignVertical: "top" },
  reportSubmitBtn: { paddingVertical: 15, alignItems: "center" },
  reportSubmitText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
