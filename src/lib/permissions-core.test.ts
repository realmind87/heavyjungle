import { describe, expect, it } from "vitest";
import {
  canModifyComment,
  canModifyPost,
  isAdminRole,
  isAdminUser,
  isAuthor,
} from "@/lib/permissions-core";

const user = { id: "u1", role: "user" as const, username: "alice" };
const adminByRole = { id: "a1", role: "admin" as const, username: "boss" };
const adminByEnv = { id: "a2", role: "user" as const, username: "envadmin" };
const envAdmins = ["envadmin"];

describe("permissions-core", () => {
  it("isAuthor matches same id only", () => {
    expect(isAuthor("u1", "u1")).toBe(true);
    expect(isAuthor("u1", "u2")).toBe(false);
  });

  it("isAdminUser checks role and env list", () => {
    expect(isAdminUser(adminByRole, envAdmins)).toBe(true);
    expect(isAdminUser(adminByEnv, envAdmins)).toBe(true);
    expect(isAdminUser(user, envAdmins)).toBe(false);
  });

  it("canModifyPost allows author or admin", () => {
    expect(canModifyPost(user, "u1", envAdmins)).toBe(true);
    expect(canModifyPost(user, "u2", envAdmins)).toBe(false);
    expect(canModifyPost(adminByRole, "u2", envAdmins)).toBe(true);
    expect(canModifyPost(null, "u1", envAdmins)).toBe(false);
  });

  it("canModifyComment mirrors post permission", () => {
    expect(canModifyComment(user, "u1", envAdmins)).toBe(true);
    expect(canModifyComment(user, "u9", envAdmins)).toBe(false);
  });

  it("isAdminRole narrows non-null admin", () => {
    expect(isAdminRole(adminByRole, envAdmins)).toBe(true);
    expect(isAdminRole(null, envAdmins)).toBe(false);
    expect(isAdminRole(user, envAdmins)).toBe(false);
  });
});
