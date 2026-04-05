import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateMerchant,
  getGetMerchantsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  "Food Delivery",
  "Restaurant",
  "Grocery",
  "E-Commerce",
  "Healthcare",
  "Electronics",
  "Personal Care",
  "Travel",
  "Entertainment",
  "Other",
];

export default function AddMerchantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createMerchant = useCreateMerchant();

  const [upiId, setUpiId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!upiId.trim()) e.upiId = "UPI ID is required";
    else if (!upiId.includes("@")) e.upiId = "Enter a valid UPI ID (e.g. name@upi)";
    if (!name.trim()) e.name = "Name is required";
    if (!category) e.category = "Category is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createMerchant.mutateAsync({
        data: { upiId: upiId.trim(), name: name.trim(), category, isVerified },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: getGetMerchantsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      Alert.alert("Success", "Merchant registered successfully!", [
        {
          text: "OK",
          onPress: () => {
            setUpiId("");
            setName("");
            setCategory("");
            setIsVerified(false);
            setErrors({});
          },
        },
      ]);
    } catch (err: any) {
      const msg = err?.data?.error || "Failed to create merchant. UPI ID may already exist.";
      Alert.alert("Error", msg);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 20, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        Register Merchant
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Add a merchant to the trust network
      </Text>

      {/* UPI ID */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>UPI ID</Text>
        <TextInput
          testID="input-upi-id"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: errors.upiId ? colors.risky : colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
              fontFamily: "Inter_400Regular",
            },
          ]}
          placeholder="merchant@upi"
          placeholderTextColor={colors.mutedForeground}
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.upiId && (
          <Text style={[styles.error, { color: colors.risky }]}>{errors.upiId}</Text>
        )}
      </View>

      {/* Name */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>Business Name</Text>
        <TextInput
          testID="input-merchant-name"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: errors.name ? colors.risky : colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
              fontFamily: "Inter_400Regular",
            },
          ]}
          placeholder="e.g. Sharma Kirana Store"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />
        {errors.name && (
          <Text style={[styles.error, { color: colors.risky }]}>{errors.name}</Text>
        )}
      </View>

      {/* Category */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
        <TouchableOpacity
          testID="button-select-category"
          onPress={() => setShowCats(!showCats)}
          style={[
            styles.input,
            styles.selectBtn,
            {
              backgroundColor: colors.card,
              borderColor: errors.category ? colors.risky : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text
            style={{
              color: category ? colors.foreground : colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
            }}
          >
            {category || "Select category"}
          </Text>
        </TouchableOpacity>
        {errors.category && (
          <Text style={[styles.error, { color: colors.risky }]}>{errors.category}</Text>
        )}
        {showCats && (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                testID={`category-option-${cat}`}
                onPress={() => {
                  setCategory(cat);
                  setShowCats(false);
                  setErrors((e) => ({ ...e, category: "" }));
                }}
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor:
                      category === cat ? colors.muted : "transparent",
                  },
                ]}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Verified toggle */}
      <View
        style={[
          styles.switchRow,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
        ]}
      >
        <View>
          <Text style={[styles.switchLabel, { color: colors.foreground }]}>
            Verified Merchant
          </Text>
          <Text style={[styles.switchHint, { color: colors.mutedForeground }]}>
            Verified votes carry more weight
          </Text>
        </View>
        <Switch
          testID="switch-verified"
          value={isVerified}
          onValueChange={setIsVerified}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        testID="button-submit-merchant"
        onPress={handleSubmit}
        disabled={createMerchant.isPending}
        style={[
          styles.submitBtn,
          {
            backgroundColor: createMerchant.isPending ? colors.muted : colors.primary,
            borderRadius: colors.radius,
          },
        ]}
        activeOpacity={0.8}
      >
        {createMerchant.isPending ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
            Register Merchant
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 28 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 8 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  selectBtn: { justifyContent: "center" },
  error: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  dropdown: {
    borderWidth: 1,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  switchLabel: { fontSize: 15, fontFamily: "Inter_500Medium", marginBottom: 2 },
  switchHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  submitBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
