import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id")
    .notNull()
    .references(() => merchantsTable.id),
  voterUpiId: text("voter_upi_id").notNull(),
  isHappy: boolean("is_happy").notNull(),
  isTransactionSafe: boolean("is_transaction_safe").notNull(),
  didMerchantBehave: boolean("did_merchant_behave").notNull(),
  isSatisfied: boolean("is_satisfied").notNull(),
  amountPaid: real("amount_paid"),
  voterWeight: real("voter_weight").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({
  id: true,
  createdAt: true,
  voterWeight: true,
});
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
