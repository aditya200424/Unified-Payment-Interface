import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const merchantsTable = pgTable("merchants", {
  id: serial("id").primaryKey(),
  upiId: text("upi_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  totalTransactions: integer("total_transactions").notNull().default(0),
  happyTransactions: integer("happy_transactions").notNull().default(0),
  fraudReports: integer("fraud_reports").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMerchantSchema = createInsertSchema(merchantsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalTransactions: true,
  happyTransactions: true,
  fraudReports: true,
});
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchantsTable.$inferSelect;
