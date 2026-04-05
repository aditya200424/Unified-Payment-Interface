import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMerchant,
  getGetMerchantQueryKey,
  useSubmitVote,
  getGetMerchantsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

type Stage = "pin" | "processing" | "success" | "vote" | "done";

interface VoteState {
  isTransactionSafe: boolean | null;
  didMerchantBehave: boolean | null;
  isSatisfied: boolean | null;
}

const PIN_AMOUNTS = ["₹100", "₹250", "₹500", "₹1000", "₹50"];

export default function PayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { upiId } = useLocalSearchParams<{ upiId: string }>();
  const decodedUpiId = decodeURIComponent(upiId ?? "");
  const queryClient = useQueryClient();

  const [pin, setPin] = useState("");
  const [stage, setStage] = useState<Stage>("pin");
  const [vote, setVote] = useState<VoteState>({
    isTransactionSafe: null,
    didMerchantBehave: null,
    isSatisfied: null,
  });
  const submitVote = useSubmitVote();

  const { data: merchant } = useGetMerchant(decodedUpiId, {
    query: { enabled: !!decodedUpiId, queryKey: getGetMerchantQueryKey(decodedUpiId) },
  });

  const handlePinPress = (digit: string) => {
    if (digit === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newPin.length === 4) {
      setTimeout(() => simulatePayment(newPin), 300);
    }
  };

  const simulatePayment = (enteredPin: string) => {
    setStage("processing");
    setTimeout(() => {
      setStage("success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setStage("vote"), 1500);
    }, 2000);
  };

  const allVotesFilled =
    vote.isTransactionSafe !== null &&
    vote.didMerchantBehave !== null &&
    vote.isSatisfied !== null;

  const isHappy =
    vote.isTransactionSafe === true &&
    vote.didMerchantBehave === true &&
    vote.isSatisfied === true;

  const handleSubmitVote = async () => {
    if (!allVotesFilled) return;
    try {
      await submitVote.mutateAsync({
        upiId: decodedUpiId,
        data: {
          voterUpiId: `voter_${Date.now().toString(36)}@upi`,
          isHappy,
          isTransactionSafe: vote.isTransactionSafe!,
          didMerchantBehave: vote.didMerchantBehave!,
          isSatisfied: vote.isSatisfied!,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetMerchantQueryKey(decodedUpiId) });
      queryClient.invalidateQueries({ queryKey: getGetMerchantsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setStage("done");
      Haptics.notificationAsync(
        isHappy
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (err: any) {
      Alert.alert("Error", err?.data?.error || "Failed to submit vote.");
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <>
      <Stack.Screen options={{ title: "Pay", headerBackTitle: "Back" }} />

      {/* PIN Entry */}
      {(stage === "pin" || stage === "processing") && (
        <View
          style={[
            styles.pinScreen,
            { backgroundColor: colors.background, paddingTop: 20, paddingBottom: bottomPad + 20 },
          ]}
        >
          {/* Merchant info */}
          <View style={[styles.payeeCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={[styles.payeeIcon, { backgroundColor: colors.muted }]}>
              <Feather name="briefcase" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.payeeName, { color: colors.foreground }]}>
              {merchant?.name ?? decodedUpiId}
            </Text>
            <Text style={[styles.payeeUpi, { color: colors.mutedForeground }]}>
              {decodedUpiId}
            </Text>
            {merchant && (
              <View style={[styles.trustPill, { backgroundColor: colors.muted }]}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text style={[styles.trustPillText, { color: colors.foreground }]}>
                  Trust Score: {merchant.trustScore}/5
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.pinTitle, { color: colors.foreground }]}>
            Enter UPI PIN
          </Text>
          {/* PIN dots */}
          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor:
                      i < pin.length ? colors.primary : colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {stage === "processing" ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.processingText, { color: colors.mutedForeground }]}>
                Processing payment...
              </Text>
            </View>
          ) : (
            /* Keypad */
            <View style={styles.keypad}>
              {["1","2","3","4","5","6","7","8","9","","0","del"].map((key, idx) => {
                if (key === "") {
                  return <View key={idx} style={styles.keypadEmpty} />;
                }
                return (
                  <TouchableOpacity
                    key={idx}
                    testID={`pin-key-${key}`}
                    onPress={() => handlePinPress(key)}
                    style={[
                      styles.keypadBtn,
                      {
                        backgroundColor: key === "del" ? "transparent" : colors.card,
                        borderColor: key === "del" ? "transparent" : colors.border,
                        borderRadius: 40,
                      },
                    ]}
                    activeOpacity={0.6}
                  >
                    {key === "del" ? (
                      <Feather name="delete" size={22} color={colors.foreground} />
                    ) : (
                      <Text style={[styles.keypadText, { color: colors.foreground }]}>
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Payment Success */}
      {stage === "success" && (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <View style={[styles.successCircle, { backgroundColor: colors.safeBackground }]}>
            <Feather name="check" size={48} color={colors.safe} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Payment Successful!
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Paid to {merchant?.name ?? decodedUpiId}
          </Text>
        </View>
      )}

      {/* Vote Modal */}
      {stage === "vote" && (
        <View style={[styles.voteScreen, { backgroundColor: colors.background, paddingBottom: bottomPad + 20, paddingTop: 20 }]}>
          <Text style={[styles.voteTitle, { color: colors.foreground }]}>
            Rate this transaction
          </Text>
          <Text style={[styles.voteSub, { color: colors.mutedForeground }]}>
            Help others by sharing your experience with {merchant?.name}
          </Text>

          {/* Q1 */}
          <VoteQuestion
            label="Was this transaction safe?"
            value={vote.isTransactionSafe}
            onYes={() => setVote((v) => ({ ...v, isTransactionSafe: true }))}
            onNo={() => setVote((v) => ({ ...v, isTransactionSafe: false }))}
            colors={colors}
          />
          {/* Q2 */}
          <VoteQuestion
            label="Did the merchant behave correctly?"
            value={vote.didMerchantBehave}
            onYes={() => setVote((v) => ({ ...v, didMerchantBehave: true }))}
            onNo={() => setVote((v) => ({ ...v, didMerchantBehave: false }))}
            colors={colors}
          />
          {/* Q3 */}
          <VoteQuestion
            label="Are you satisfied?"
            value={vote.isSatisfied}
            onYes={() => setVote((v) => ({ ...v, isSatisfied: true }))}
            onNo={() => setVote((v) => ({ ...v, isSatisfied: false }))}
            colors={colors}
          />

          <TouchableOpacity
            testID="button-submit-vote"
            onPress={handleSubmitVote}
            disabled={!allVotesFilled || submitVote.isPending}
            style={[
              styles.voteSubmitBtn,
              {
                backgroundColor: allVotesFilled ? colors.primary : colors.muted,
                borderRadius: colors.radius,
              },
            ]}
            activeOpacity={0.8}
          >
            {submitVote.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text
                style={[
                  styles.voteSubmitText,
                  { color: allVotesFilled ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                Submit Feedback
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="button-skip-vote"
            onPress={() => router.back()}
            style={styles.skipBtn}
          >
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Done */}
      {stage === "done" && (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.successCircle,
              { backgroundColor: isHappy ? colors.safeBackground : colors.mediumBackground },
            ]}
          >
            <Feather
              name={isHappy ? "thumbs-up" : "thumbs-down"}
              size={48}
              color={isHappy ? colors.safe : colors.medium}
            />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            {isHappy ? "Thank you!" : "Feedback Noted"}
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            {isHappy
              ? "Your positive vote has been recorded."
              : "This transaction has been flagged for review."}
          </Text>
          <TouchableOpacity
            testID="button-done"
            onPress={() => router.back()}
            style={[
              styles.doneBtn,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

function VoteQuestion({
  label, value, onYes, onNo, colors
}: {
  label: string;
  value: boolean | null;
  onYes: () => void;
  onNo: () => void;
  colors: any;
}) {
  return (
    <View style={[styles.voteQuestion, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[styles.voteQuestionText, { color: colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.voteButtons}>
        <TouchableOpacity
          testID={`vote-yes-${label.slice(0, 10)}`}
          onPress={onYes}
          style={[
            styles.voteBtn,
            {
              backgroundColor: value === true ? colors.safeBackground : colors.muted,
              borderColor: value === true ? colors.safe : colors.border,
              borderRadius: colors.radius,
            },
          ]}
          activeOpacity={0.7}
        >
          <Feather name="thumbs-up" size={18} color={value === true ? colors.safe : colors.mutedForeground} />
          <Text style={[styles.voteBtnText, { color: value === true ? colors.safe : colors.mutedForeground }]}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`vote-no-${label.slice(0, 10)}`}
          onPress={onNo}
          style={[
            styles.voteBtn,
            {
              backgroundColor: value === false ? colors.riskyBackground : colors.muted,
              borderColor: value === false ? colors.risky : colors.border,
              borderRadius: colors.radius,
            },
          ]}
          activeOpacity={0.7}
        >
          <Feather name="thumbs-down" size={18} color={value === false ? colors.risky : colors.mutedForeground} />
          <Text style={[styles.voteBtnText, { color: value === false ? colors.risky : colors.mutedForeground }]}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pinScreen: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  payeeCard: { width: "100%", borderWidth: 1, padding: 20, marginBottom: 32, alignItems: "center" },
  payeeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  payeeName: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  payeeUpi: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  trustPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trustPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  pinTitle: { fontSize: 16, fontFamily: "Inter_500Medium", marginBottom: 20 },
  pinDots: { flexDirection: "row", gap: 16, marginBottom: 40 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
  processingContainer: { alignItems: "center", gap: 14 },
  processingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 280, gap: 16, justifyContent: "center" },
  keypadEmpty: { width: 72, height: 72 },
  keypadBtn: { width: 72, height: 72, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  keypadText: { fontSize: 22, fontFamily: "Inter_500Medium" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  voteScreen: { flex: 1, paddingHorizontal: 20 },
  voteTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8 },
  voteSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 24, lineHeight: 20 },
  voteQuestion: { borderWidth: 1, padding: 16, marginBottom: 12 },
  voteQuestionText: { fontSize: 15, fontFamily: "Inter_500Medium", marginBottom: 12 },
  voteButtons: { flexDirection: "row", gap: 12 },
  voteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, paddingVertical: 10 },
  voteBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  voteSubmitBtn: { paddingVertical: 15, alignItems: "center", marginTop: 8, marginBottom: 12 },
  voteSubmitText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, marginTop: 8 },
});
