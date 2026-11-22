import type { MentorAvailabilitySlot, MentorSlot } from "@open-lms/types";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Jakarta is fixed UTC+7 (no DST)

export interface SlotOptions {
  /** Number of days ahead to generate (default 14). */
  days?: number;
  /** Minimum lead time in hours from `now` (default 12). */
  minLeadHours?: number;
  /** Session duration in minutes (default 60). */
  minutes?: number;
}

/**
 * Pure slot generator (CORE_PLAN.md Feature 1.3):
 * Converts a mentor's weekly WIB availability template into concrete UTC ISO slots
 * for the next `days` days, filtering out slots within `minLeadHours` of `now`
 * and slots already booked (`PENDING` or `CONFIRMED`).
 */
export function upcomingSlots(
  template: MentorAvailabilitySlot[],
  bookedStartsAtIso: Iterable<string>,
  now: Date = new Date(),
  opts: SlotOptions = {},
): MentorSlot[] {
  const days = opts.days ?? 14;
  const minLeadHours = opts.minLeadHours ?? 12;
  const durationMinutes = opts.minutes ?? 60;
  if (!template.length || durationMinutes <= 0 || days <= 0) return [];

  const bookedEpoch = new Set<number>();
  for (const iso of bookedStartsAtIso) {
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) bookedEpoch.add(t);
  }

  const earliestMs = now.getTime() + minLeadHours * 60 * 60 * 1000;
  // Convert `now` into WIB wall-clock midnight
  const nowWib = new Date(now.getTime() + WIB_OFFSET_MS);
  const baseWibMidnightUtcMs =
    Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate()) - WIB_OFFSET_MS;

  const sortedTemplate = [...template].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
  const results: MentorSlot[] = [];

  for (let d = 0; d < days; d++) {
    const dayStartUtcMs = baseWibMidnightUtcMs + d * 24 * 60 * 60 * 1000;
    const wibDate = new Date(dayStartUtcMs + WIB_OFFSET_MS);
    const weekday = wibDate.getUTCDay(); // 0 = Sunday .. 6 = Saturday in WIB

    for (const row of sortedTemplate) {
      if (row.weekday !== weekday) continue;
      for (let startMin = row.startMinute; startMin + durationMinutes <= row.endMinute; startMin += durationMinutes) {
        const slotStartMs = dayStartUtcMs + startMin * 60 * 1000;
        if (slotStartMs < earliestMs) continue;
        if (bookedEpoch.has(slotStartMs)) continue;
        const slotEndMs = slotStartMs + durationMinutes * 60 * 1000;
        results.push({
          startsAt: new Date(slotStartMs).toISOString(),
          endsAt: new Date(slotEndMs).toISOString(),
        });
      }
    }
  }

  return results;
}

/** Format an ISO timestamp in WIB (Asia/Jakarta), e.g. "Senin, 23 Nov 2026 · 16.00 WIB". */
export function formatWibDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d);
  return `${datePart} · ${timePart} WIB`;
}

/** Format an ISO timestamp into a WIB date group header, e.g. "Senin, 23 Nov". */
export function formatWibDateHeader(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/** Format an ISO timestamp into WIB time only, e.g. "16.00 WIB". */
export function formatWibTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const t = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d);
  return `${t} WIB`;
}

export const WEEKDAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export function formatMinuteOfDay(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
