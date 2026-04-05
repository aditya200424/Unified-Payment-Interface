import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type RiskLevel = "Safe" | "Medium" | "Risky";

interface Merchant {
  id: number;
  upiId: string;
  name: string;
  category: string;
  totalTransactions: number;
  happyTransactions: number;
  fraudReports: number;
  trustScore: number;
  satisfactionPercent: number;
  riskLevel: RiskLevel;
  isVerified: boolean;
  createdAt: string;
}

interface Props {
  merchant: Merchant;
  onPress: () => void;
}

export function MerchantCard({ merchant, onPress }: Props) {
  const colors = useColors();

  const riskColor =
    merchant.riskLevel === "Safe"
      ? colors.safe
      : merchant.riskLevel === "Medium"
      ? colors.medium
      : colors.risky;

  const riskBg =
    merchant.riskLevel === "Safe"
      ? colors.safeBackground
      : merchant.riskLevel === "Medium"
      ? colors.mediumBackground
      : colors.riskyBackground;

  const stars = Math.round(merchant.trustScore);

  return (
    <TouchableOpacity
      testID={`merchant-card-${merchant.id}`}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {merchant.name}
          </Text>
          {merchant.isVerified && (
            <Feather
              name="check-circle"
              size={14}
              color={colors.primary}
              style={styles.verifiedIcon}
            />
          )}
        </View>
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: riskBg },
          ]}
        >
          <Text style={[styles.riskText, { color: riskColor }]}>
            {merchant.riskLevel}
          </Text>
        </View>
      </View>

      <Text style={[styles.upiId, { color: colors.mutedForeground }]}>
        {merchant.upiId}
      </Text>

      <View style={styles.footer}>
        <View style={styles.scoreRow}>
          <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
          <Text style={[styles.scoreText, { color: colors.foreground }]}>
            {merchant.trustScore.toFixed(1)}
          </Text>
          <Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>
            /5
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Feather name="check" size={12} color={colors.safe} />
          <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
            {merchant.happyTransactions.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {" "}happy
          </Text>
          <Text style={[styles.statSep, { color: colors.border }]}> · </Text>
          <Feather name="percent" size={11} color={colors.mutedForeground} />
          <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
            {merchant.satisfactionPercent}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  verifiedIcon: { marginLeft: 5 },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  riskText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  upiId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  scoreText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  scoreMax: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginLeft: 3,
  },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statSep: { fontSize: 12 },
});
