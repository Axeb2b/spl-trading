import { describe, expect, it } from "vitest";
import { relativeIst } from "@/lib/time/relative";

const NOW = "2026-10-21T08:37:12.482Z";

function ago(seconds: number): string {
  return new Date(Date.parse(NOW) - seconds * 1000).toISOString();
}

describe("relativeIst", () => {
  it("collapses tiny deltas to 'just now'", () => {
    expect(relativeIst(ago(10), NOW)).toBe("just now");
  });

  it("uses minutes up to 44", () => {
    expect(relativeIst(ago(120), NOW)).toBe("2 min ago");
    expect(relativeIst(ago(44 * 60), NOW)).toBe("44 min ago");
  });

  it("switches to hours at 90 minutes", () => {
    // 90 min = 1.5 h and the label rounds to the nearest unit.
    expect(relativeIst(ago(90 * 60), NOW)).toBe("2 h ago");
    expect(relativeIst(ago(60 * 60), NOW)).toBe("1 h ago");
  });

  it("switches to days at 36 hours", () => {
    expect(relativeIst(ago(36 * 3600), NOW)).toBe("2 d ago");
    expect(relativeIst(ago(10 * 86400), NOW)).toBe("10 d ago");
  });

  it("switches to months at 45 days", () => {
    expect(relativeIst(ago(60 * 86400), NOW)).toBe("2 mo ago");
  });

  it("handles future instants", () => {
    const future = new Date(Date.parse(NOW) + 5 * 60 * 1000).toISOString();
    expect(relativeIst(future, NOW)).toBe("in 5 min");
  });

  it("returns an empty string past 320 days so the caller falls back to an absolute date", () => {
    expect(relativeIst(ago(400 * 86400), NOW)).toBe("");
  });
});
