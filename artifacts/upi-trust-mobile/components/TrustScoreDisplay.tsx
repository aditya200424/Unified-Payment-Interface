import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  score: number;
  size?: "small" | "large";
}

export function TrustScoreDisplay({ score, size = "large" }: Props) {
  const colors = useColors();
  const isLarge = size === "large";

  const scoreColor =
    score >= 4
      ? colors.safe
      : score >= 2.5
      ? colors.medium
      : colors.risky;

  const filledStars = Math.floor(score);
  const hasHalf = score - filledStars >= 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.numberRow}>
        <Text
          style={[
            styles.scoreNumber,
            {
              color: scoreColor,
              fontSize: isLarge ? 52 : 28,
              fontFamily: "Inter_700Bold",
            },
          ]}
        >
          {score.toFixed(1)}
        </Text>
        <Text
          style={[
            styles.scoreMax,
            {
              color: colors.mutedForeground,
              fontSize: isLarge ? 20 : 14,
              marginTop: isLarge ? 20 : 8,
            },
          ]}
        >
          /5
        </Text>
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => {
          const name =
            i <= filledStars
              ? "star"
              : i === filledStars + 1 && hasHalf
              ? "star-half-full"
              : "star-outline";
          return (
            <MaterialCommunityIcons
              key={i}
              name={name}
              size={isLarge ? 22 : 14}
              color="#F59E0B"
              style={{ marginRight: 2 }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  scoreNumber: {},
  scoreMax: {},
  starsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
});
