"use client";

import { useEffect, useState } from "react";

export type CountdownUrgency = "safe" | "warning" | "urgent" | "expired";

export interface CountdownState {
  mounted: boolean;
  expired: boolean;
  urgency: CountdownUrgency;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
}

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

export function computeCountdown(deadlineIso: string, nowMs: number): CountdownState {
  const targetMs = Date.parse(deadlineIso);
  const diffMs = Number.isNaN(targetMs) ? -1 : targetMs - nowMs;

  if (diffMs <= 0) {
    return {
      mounted: true,
      expired: true,
      urgency: "expired",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Ditutup",
    };
  }

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  let urgency: CountdownUrgency = "safe";
  if (diffMs <= 24 * 3600_000) urgency = "urgent";
  else if (diffMs <= 7 * 86400_000) urgency = "warning";

  const label =
    urgency === "urgent"
      ? `${pad2(hours)}j ${pad2(minutes)}m ${pad2(seconds)}d`
      : `${days}h ${pad2(hours)}j ${pad2(minutes)}m`;

  return {
    mounted: true,
    expired: false,
    urgency,
    days,
    hours,
    minutes,
    seconds,
    label,
  };
}

/**
 * Live countdown hook (CORE_PLAN.md Feature 1.4):
 * - Renders after client mount to avoid SSR hydration mismatch.
 * - Ticks every 1s only when remaining time < 24h; otherwise ticks every 60s.
 */
export function useCountdown(deadlineIso: string): CountdownState {
  const [state, setState] = useState<CountdownState>({
    mounted: false,
    expired: false,
    urgency: "safe",
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    label: "...",
  });

  useEffect(() => {
    const update = () => {
      const next = computeCountdown(deadlineIso, Date.now());
      setState(next);
      return next;
    };
    const current = update();
    if (current.expired) return;

    const intervalMs = current.urgency === "urgent" ? 1000 : 60_000;
    const id = window.setInterval(update, intervalMs);
    return () => window.clearInterval(id);
  }, [deadlineIso, state.urgency]);

  return state;
}
