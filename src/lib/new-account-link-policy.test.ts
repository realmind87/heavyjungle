import { describe, expect, it } from "vitest";
import {
  isNewAccount,
  NEW_ACCOUNT_LINK_POLICY_DAYS,
  newAccountAgeDays,
  shouldApplyNewAccountLinkPolicy,
} from "@/lib/new-account-link-policy";

describe("isNewAccount", () => {
  it("returns true within policy window", () => {
    const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(isNewAccount(createdAt)).toBe(true);
  });

  it("returns false after policy window", () => {
    const createdAt = new Date(
      Date.now() - (NEW_ACCOUNT_LINK_POLICY_DAYS + 1) * 24 * 60 * 60 * 1000,
    );
    expect(isNewAccount(createdAt)).toBe(false);
  });
});

describe("shouldApplyNewAccountLinkPolicy", () => {
  it("skips admins", () => {
    const createdAt = new Date();
    expect(shouldApplyNewAccountLinkPolicy(createdAt, true)).toBe(false);
  });

  it("applies to new non-admin accounts", () => {
    const createdAt = new Date();
    expect(shouldApplyNewAccountLinkPolicy(createdAt, false)).toBe(true);
  });
});

describe("newAccountAgeDays", () => {
  it("returns at least 1 day", () => {
    expect(newAccountAgeDays(new Date())).toBe(1);
  });
});
