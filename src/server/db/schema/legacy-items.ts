import { index, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** @deprecated 데모용 — 커뮤니티 스키마 안정화 후 제거 예정 */
export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("items_created_at_idx").on(table.createdAt),
    index("items_title_idx").on(table.title),
  ],
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
