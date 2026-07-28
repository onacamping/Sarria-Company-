import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promoCodesTable = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percentage"), // "percentage" | "fixed"
  value: integer("value").notNull(),                  // percent (0-100) or COP cents
  description: text("description").notNull().default(""),
  minOrderAmount: integer("min_order_amount").notNull().default(0),
  maxUses: integer("max_uses"),                       // null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),                 // null = no expiry
  appliesTo: text("applies_to").notNull().default("all"), // "all" | "category:plantas" | etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodesTable).omit({
  id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodesTable.$inferSelect;
