import { describe, expect, it } from "vitest";
import { calcRatio, fillDailySeries, formatDayLabel } from "@/features/admin/analytics-utils";

describe("fillDailySeries", () => {
  it("fills missing days with zero", () => {
    const now = new Date("2026-07-06T12:00:00.000Z");
    const rows = fillDailySeries(
      [
        { day: "2026-07-04", count: 2 },
        { day: "2026-07-06", count: 5 },
      ],
      3,
      now,
    );

    expect(rows).toEqual([
      { day: "2026-07-04", count: 2 },
      { day: "2026-07-05", count: 0 },
      { day: "2026-07-06", count: 5 },
    ]);
  });
});

describe("formatDayLabel", () => {
  it("formats month/day without leading zeros requirement", () => {
    expect(formatDayLabel("2026-07-06")).toBe("7/6");
  });
});

describe("calcRatio", () => {
  it("returns percentage with one decimal", () => {
    expect(calcRatio(3, 10)).toBe(30);
    expect(calcRatio(1, 3)).toBe(33.3);
  });

  it("returns zero when denominator is zero", () => {
    expect(calcRatio(5, 0)).toBe(0);
  });
});
