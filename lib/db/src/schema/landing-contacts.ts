import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landingContactsTable = pgTable("landing_contacts", {
  id: serial("id").primaryKey(),
  landingSlug: text("landing_slug").notNull(),
  landingTitle: text("landing_title"),
  name: text("name").notNull(),
  company: text("company"),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLandingContactSchema = createInsertSchema(landingContactsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLandingContact = z.infer<typeof insertLandingContactSchema>;
export type LandingContact = typeof landingContactsTable.$inferSelect;
