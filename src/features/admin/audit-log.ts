/**
 * 관리자 조치 감사 로그 기록.
 */
import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { adminAuditLogs, users } from "@/server/db/schema";
import type { AdminAuditLog } from "@/server/db/schema/admin-audit-logs";

export type AdminAuditAction = AdminAuditLog["action"];

export async function logAdminAction(options: {
  actorId: string;
  action: AdminAuditAction;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminAuditLogs).values({
    actorId: options.actorId,
    action: options.action,
    targetId: options.targetId ?? null,
    targetLabel: options.targetLabel ?? null,
    metadata: options.metadata ?? null,
  });
}

export type AdminAuditLogListItem = {
  id: string;
  action: AdminAuditAction;
  targetId: string | null;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
  };
};

const AUDIT_LOG_LIMIT = 100;

export async function listAdminAuditLogs(): Promise<AdminAuditLogListItem[]> {
  const rows = await db
    .select({
      id: adminAuditLogs.id,
      action: adminAuditLogs.action,
      targetId: adminAuditLogs.targetId,
      targetLabel: adminAuditLogs.targetLabel,
      metadata: adminAuditLogs.metadata,
      createdAt: adminAuditLogs.createdAt,
      actorId: users.id,
      actorUsername: users.username,
    })
    .from(adminAuditLogs)
    .innerJoin(users, eq(adminAuditLogs.actorId, users.id))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(AUDIT_LOG_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    metadata: row.metadata,
    createdAt: row.createdAt,
    actor: {
      id: row.actorId,
      username: row.actorUsername,
    },
  }));
}
