import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landingPagesTable = pgTable("landing_pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  content: text("content").notNull().default(""),
  metaDescription: text("meta_description"),
  formTitle: text("form_title").notNull().default("Contáctenos"),
  formDescription: text("form_description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  customStyles: text("custom_styles").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLandingPageSchema = createInsertSchema(landingPagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLandingPage = z.infer<typeof insertLandingPageSchema>;
export type LandingPage = typeof landingPagesTable.$inferSelect;
