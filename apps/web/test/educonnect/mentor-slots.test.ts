import { describe, expect, it } from "vitest";
import { upcomingSlots } from "@/lib/educonnect/mentor-slots";

describe("mentor upcoming WIB slots generator (Feature 1.3)", () => {
  // 2026-11-22T00:00:00Z is Sunday 07:00 WIB
  const now = new Date("2026-11-22T00:00:00.000Z");

  it("enforces 12-hour minimum lead time, splits by session duration, and drops booked slots", () => {
    const template = [
      // Sunday 10:00–12:00 WIB (03:00–05:00 UTC) -> only 3h ahead of `now`, should be skipped (< 12h lead time)!
      { weekday: 0, startMinute: 600, endMinute: 720 },
      // Monday 16:00–18:00 WIB (09:00–11:00 UTC on 2026-11-23) -> 2 slots of 60m
      { weekday: 1, startMinute: 960, endMinute: 1080 },
    ];
    const bookedSlot = "2026-11-23T09:00:00.000Z"; // Monday 16:00 WIB is already taken

    const slots = upcomingSlots(template, [bookedSlot], now, {
      days: 7,
      minLeadHours: 12,
      minutes: 60,
    });

    // Only Monday 17:00–18:00 WIB (10:00–11:00 UTC) should remain in the first 7 days
    expect(slots).toEqual([
      {
        startsAt: "2026-11-23T10:00:00.000Z",
        endsAt: "2026-11-23T11:00:00.000Z",
      },
    ]);
  });
});
