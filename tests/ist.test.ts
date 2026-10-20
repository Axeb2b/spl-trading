import { describe, expect, it } from "vitest";
import {
  addIstDays,
  formatCountdown,
  formatIst,
  istDayEndUtc,
  istDayRange,
  istDayStartUtc,
  istTodayKey,
  toIstParts,
} from "@/lib/time/ist";

describe("Asia/Kolkata conversion", () => {
  it("shifts UTC to IST (+05:30) and reads civil fields", () => {
    const parts = toIstParts("2026-10-21T08:37:12.482Z");
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(10);
    expect(parts.day).toBe(21);
    expect(parts.hour).toBe(14);
    expect(parts.minute).toBe(7);
    expect(parts.dateKey).toBe("2026-10-21");
  });

  it("rolls the date over correctly past 18:30 UTC", () => {
    const parts = toIstParts("2026-10-21T19:05:00.000Z");
    expect(parts.dateKey).toBe("2026-10-22");
    expect(parts.hour).toBe(0);
    expect(parts.minute).toBe(35);
  });

  it("maps an IST day start back to the previous UTC day", () => {
    expect(istDayStartUtc("2026-10-21")).toBe("2026-10-20T18:30:00.000Z");
    expect(istDayEndUtc("2026-10-21")).toBe("2026-10-21T18:29:59.999Z");
  });

  it("builds inclusive IST day ranges", () => {
    const range = istDayRange("2026-10-01", "2026-10-21");
    expect(range.fromUtc).toBe("2026-09-30T18:30:00.000Z");
    expect(range.toUtc).toBe("2026-10-21T18:29:59.999Z");
    expect(range.days).toBe(21);
  });

  it("adds IST calendar days", () => {
    expect(addIstDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addIstDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("formats user-facing IST strings", () => {
    expect(formatIst("2026-10-21T08:37:12.482Z", "full")).toBe("21 Oct 2026, 14:07 IST");
    expect(formatIst("2026-10-21T08:37:12.482Z", "date")).toBe("21 Oct 2026");
    expect(formatIst("2026-10-21T08:37:12.482Z", "time")).toBe("14:07 IST");
  });

  it("formats a deposit countdown", () => {
    const now = "2026-10-21T08:37:12.482Z";
    expect(formatCountdown("2026-10-21T08:51:12.482Z", now)).toBe("Expires in 14 min");
    expect(formatCountdown("2026-10-21T08:20:12.482Z", now)).toBe("Expired 17 min ago");
  });

  it("knows today in IST", () => {
    expect(istTodayKey("2026-10-21T19:05:00.000Z")).toBe("2026-10-22");
  });
});
