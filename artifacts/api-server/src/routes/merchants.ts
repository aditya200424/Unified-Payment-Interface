import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, merchantsTable, votesTable, fraudReportsTable } from "@workspace/db";
import {
  CreateMerchantBody,
  SubmitVoteBody,
  ReportFraudBody,
  GetMerchantParams,
  SubmitVoteParams,
  GetMerchantStatsParams,
  ReportFraudParams,
} from "@workspace/api-zod";
import { formatMerchant, computeTrustScore, computeRiskLevel, computeSatisfactionPercent } from "../lib/trust-score";

const router: IRouter = Router();

router.get("/merchants", async (_req, res): Promise<void> => {
  const merchants = await db
    .select()
    .from(merchantsTable)
    .orderBy(desc(merchantsTable.createdAt));

  res.json(merchants.map(formatMerchant));
});

router.post("/merchants", async (req, res): Promise<void> => {
  const parsed = CreateMerchantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.upiId, parsed.data.upiId))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "A merchant with this UPI ID already exists" });
    return;
  }

  const [merchant] = await db
    .insert(merchantsTable)
    .values({
      upiId: parsed.data.upiId,
      name: parsed.data.name,
      category: parsed.data.category,
      isVerified: parsed.data.isVerified ?? false,
    })
    .returning();

  res.status(201).json(formatMerchant(merchant));
});

router.get("/merchants/:upiId", async (req, res): Promise<void> => {
  const upiId = Array.isArray(req.params.upiId)
    ? req.params.upiId[0]
    : req.params.upiId;

  const [merchant] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.upiId, upiId));

  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }

  res.json(formatMerchant(merchant));
});

router.post("/merchants/:upiId/vote", async (req, res): Promise<void> => {
  const upiId = Array.isArray(req.params.upiId)
    ? req.params.upiId[0]
    : req.params.upiId;

  const parsed = SubmitVoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [merchant] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.upiId, upiId));

  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }

  const existingVote = await db
    .select()
    .from(votesTable)
    .where(
      and(
        eq(votesTable.merchantId, merchant.id),
        eq(votesTable.voterUpiId, parsed.data.voterUpiId)
      )
    )
    .limit(1);

  if (existingVote.length > 0) {
    res.status(400).json({ error: "You have already voted for this merchant" });
    return;
  }

  const voterWeight = merchant.isVerified ? 1.5 : 1.0;

  await db.insert(votesTable).values({
    merchantId: merchant.id,
    voterUpiId: parsed.data.voterUpiId,
    isHappy: parsed.data.isHappy,
    isTransactionSafe: parsed.data.isTransactionSafe,
    didMerchantBehave: parsed.data.didMerchantBehave,
    isSatisfied: parsed.data.isSatisfied,
    amountPaid: parsed.data.amountPaid ?? null,
    voterWeight,
  });

  const happyIncrement = parsed.data.isHappy ? 1 : 0;

  const [updated] = await db
    .update(merchantsTable)
    .set({
      totalTransactions: sql`${merchantsTable.totalTransactions} + 1`,
      happyTransactions: sql`${merchantsTable.happyTransactions} + ${happyIncrement}`,
    })
    .where(eq(merchantsTable.id, merchant.id))
    .returning();

  res.json({
    success: true,
    message: parsed.data.isHappy
      ? "Thank you! Your positive vote has been recorded."
      : "Thank you for the feedback. This transaction has been flagged.",
    updatedMerchant: formatMerchant(updated),
  });
});

router.get("/merchants/:upiId/stats", async (req, res): Promise<void> => {
  const upiId = Array.isArray(req.params.upiId)
    ? req.params.upiId[0]
    : req.params.upiId;

  const [merchant] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.upiId, upiId));

  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }

  const allVotes = await db
    .select()
    .from(votesTable)
    .where(eq(votesTable.merchantId, merchant.id))
    .orderBy(desc(votesTable.createdAt))
    .limit(50);

  const fraudCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(fraudReportsTable)
    .where(eq(fraudReportsTable.merchantId, merchant.id));

  const weeklyMap = new Map<string, { happy: number; total: number }>();
  for (const vote of allVotes) {
    const week = getWeekLabel(vote.createdAt);
    const existing = weeklyMap.get(week) ?? { happy: 0, total: 0 };
    weeklyMap.set(week, {
      happy: existing.happy + (vote.isHappy ? 1 : 0),
      total: existing.total + 1,
    });
  }

  const weeklyVotes = Array.from(weeklyMap.entries())
    .map(([week, stats]) => ({ week, ...stats }))
    .slice(0, 8);

  const recentVotes = allVotes.slice(0, 10).map((v) => ({
    id: v.id,
    isHappy: v.isHappy,
    createdAt: v.createdAt.toISOString(),
  }));

  res.json({
    merchant: formatMerchant(merchant),
    weeklyVotes,
    recentVotes,
    fraudReportCount: Number(fraudCount[0]?.count ?? 0),
  });
});

router.post("/merchants/:upiId/report-fraud", async (req, res): Promise<void> => {
  const upiId = Array.isArray(req.params.upiId)
    ? req.params.upiId[0]
    : req.params.upiId;

  const parsed = ReportFraudBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [merchant] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.upiId, upiId));

  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }

  await db.insert(fraudReportsTable).values({
    merchantId: merchant.id,
    reporterUpiId: parsed.data.reporterUpiId,
    reason: parsed.data.reason,
  });

  await db
    .update(merchantsTable)
    .set({
      fraudReports: sql`${merchantsTable.fraudReports} + 1`,
    })
    .where(eq(merchantsTable.id, merchant.id));

  res.json({
    success: true,
    message: "Fraud report submitted. This will impact the merchant's trust score.",
  });
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const allMerchants = await db.select().from(merchantsTable);

  const formatted = allMerchants.map(formatMerchant);

  const safe = formatted.filter((m) => m.riskLevel === "Safe").length;
  const medium = formatted.filter((m) => m.riskLevel === "Medium").length;
  const risky = formatted.filter((m) => m.riskLevel === "Risky").length;

  const avgScore =
    formatted.length > 0
      ? Math.round(
          (formatted.reduce((sum, m) => sum + m.trustScore, 0) / formatted.length) * 10
        ) / 10
      : 0;

  const totalTransactions = formatted.reduce((sum, m) => sum + m.totalTransactions, 0);

  const fraudResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(fraudReportsTable);

  const topTrusted = [...formatted]
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 5);

  res.json({
    totalMerchants: formatted.length,
    totalTransactions,
    safeMerchants: safe,
    mediumMerchants: medium,
    riskyMerchants: risky,
    averageTrustScore: avgScore,
    totalFraudReports: Number(fraudResult[0]?.count ?? 0),
    topTrustedMerchants: topTrusted,
  });
});

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default router;
