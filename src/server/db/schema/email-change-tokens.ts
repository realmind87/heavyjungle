import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/** 이메일 변경 인증 — 새 주소로 링크 발송, 확인 후 users.email 갱신 */
export const emailChangeTokens = pgTable("email_change_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** SHA-256 해시 — 원본 토큰은 이메일 링크에만 포함 */
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  newEmail: text("new_email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmailChangeToken = typeof emailChangeTokens.$inferSelect;
