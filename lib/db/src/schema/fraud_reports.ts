import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const fraudReportsTable = pgTable("fraud_reports", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id")
    .notNull()
    .references(() => merchantsTable.id),
  reporterUpiId: text("reporter_upi_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFraudReportSchema = createInsertSchema(fraudReportsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFraudReport = z.infer<typeof insertFraudReportSchema>;
export type FraudReport = typeof fraudReportsTable.$inferSelect;
