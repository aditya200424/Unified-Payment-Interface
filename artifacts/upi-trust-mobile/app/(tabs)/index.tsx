import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { MerchantCard } from "@/components/MerchantCard";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/merchant/${encodeURIComponent(q)}`);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 20, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Verify before you pay
        </Text>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          UPI{" "}
          <Text style={{ color: colors.primary }}>TrustScore</Text>
        </Text>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          testID="input-upi-search"
          style={[
            styles.searchInput,
            { color: colors.foreground, fontFamily: "Inter_400Regular" },
          ]}
          placeholder="Enter UPI ID (e.g. merchant@upi)"
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            testID="button-search-clear"
            onPress={() => setSearchQuery("")}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        testID="button-look-up"
        onPress={handleSearch}
        style={[
          styles.lookupBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
          },
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.lookupBtnText, { color: colors.primaryForeground }]}>
          Look Up Merchant
        </Text>
        <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Stats */}
      {isLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: 32 }}
        />
      ) : summary ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Merchants"
              value={summary.totalMerchants.toString()}
              icon="shield"
              color={colors.primary}
              bg={colors.muted}
              cardBg={colors.card}
              border={colors.border}
              radius={colors.radius}
              fg={colors.foreground}
              muted={colors.mutedForeground}
            />
            <StatCard
              label="Safe Merchants"
              value={summary.safeMerchants.toString()}
              icon="check-circle"
              color={colors.safe}
              bg={colors.safeBackground}
              cardBg={colors.card}
              border={colors.border}
              radius={colors.radius}
              fg={colors.foreground}
              muted={colors.mutedForeground}
            />
            <StatCard
              label="Avg Trust Score"
              value={`${summary.averageTrustScore}/5`}
              icon="star"
              color="#F59E0B"
              bg="#FEF3C7"
              cardBg={colors.card}
              border={colors.border}
              radius={colors.radius}
              fg={colors.foreground}
              muted={colors.mutedForeground}
            />
            <StatCard
              label="Fraud Reports"
              value={summary.totalFraudReports.toString()}
              icon="alert-triangle"
              color={colors.risky}
              bg={colors.riskyBackground}
              cardBg={colors.card}
              border={colors.border}
              radius={colors.radius}
              fg={colors.foreground}
              muted={colors.mutedForeground}
            />
          </View>

          {/* Top Trusted */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Top Trusted Merchants
          </Text>
          {summary.topTrustedMerchants.map((merchant) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              onPress={() =>
                router.push(`/merchant/${encodeURIComponent(merchant.upiId)}`)
              }
            />
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: any;
  color: string;
  bg: string;
  cardBg: string;
  border: string;
  radius: number;
  fg: string;
  muted: string;
}

function StatCard({ label, value, icon, color, bg, cardBg, border, radius, fg, muted }: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: cardBg, borderColor: border, borderRadius: radius },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerSection: { marginBottom: 24 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  headline: { fontSize: 32, fontFamily: "Inter_700Bold", lineHeight: 38 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    marginBottom: 28,
  },
  lookupBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    borderWidth: 1,
    padding: 14,
    width: "47%",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 14,
  },
});
