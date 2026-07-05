import { describe, expect, it } from "vitest";
import { isPasswordStrong, passwordSchema } from "@/lib/validators/password";
import { signUpSchema } from "@/lib/validators/auth";

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("abc12345").success).toBe(true);
  });

  it("rejects passwords without letters", () => {
    const result = passwordSchema.safeParse("12345678");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without numbers", () => {
    const result = passwordSchema.safeParse("abcdefgh");
    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("ab1");
    expect(result.success).toBe(false);
  });
});

describe("isPasswordStrong", () => {
  it("returns true when all checks pass", () => {
    expect(isPasswordStrong("pass1234")).toBe(true);
  });

  it("returns false when a check fails", () => {
    expect(isPasswordStrong("password")).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("requires matching confirm password", () => {
    const result = signUpSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "pass1234",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === "비밀번호가 일치하지 않습니다.")).toBe(
        true,
      );
    }
  });
});
