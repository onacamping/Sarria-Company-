import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull().default("pdf"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Certificate = typeof certificatesTable.$inferSelect;
