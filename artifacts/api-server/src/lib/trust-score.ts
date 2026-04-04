export type RiskLevel = "Safe" | "Medium" | "Risky";

export function computeTrustScore(
  happyTransactions: number,
  totalTransactions: number,
  fraudReports: number
): number {
  if (totalTransactions === 0) return 3.0;

  const baseScore = (happyTransactions / totalTransactions) * 5;

  const fraudPenalty = Math.min(fraudReports * 0.3, 2.5);
  const score = Math.max(0, Math.min(5, baseScore - fraudPenalty));

  return Math.round(score * 10) / 10;
}

export function computeRiskLevel(trustScore: number, fraudReports: number): RiskLevel {
  if (fraudReports >= 5 || trustScore < 2.5) return "Risky";
  if (fraudReports >= 2 || trustScore < 3.5) return "Medium";
  return "Safe";
}

export function computeSatisfactionPercent(
  happyTransactions: number,
  totalTransactions: number
): number {
  if (totalTransactions === 0) return 0;
  return Math.round((happyTransactions / totalTransactions) * 100);
}

export function formatMerchant(merchant: {
  id: number;
  upiId: string;
  name: string;
  category: string;
  totalTransactions: number;
  happyTransactions: number;
  fraudReports: number;
  isVerified: boolean;
  createdAt: Date;
}) {
  const trustScore = computeTrustScore(
    merchant.happyTransactions,
    merchant.totalTransactions,
    merchant.fraudReports
  );
  const riskLevel = computeRiskLevel(trustScore, merchant.fraudReports);
  const satisfactionPercent = computeSatisfactionPercent(
    merchant.happyTransactions,
    merchant.totalTransactions
  );

  return {
    id: merchant.id,
    upiId: merchant.upiId,
    name: merchant.name,
    category: merchant.category,
    totalTransactions: merchant.totalTransactions,
    happyTransactions: merchant.happyTransactions,
    fraudReports: merchant.fraudReports,
    trustScore,
    satisfactionPercent,
    riskLevel,
    isVerified: merchant.isVerified,
    createdAt: merchant.createdAt.toISOString(),
  };
}
