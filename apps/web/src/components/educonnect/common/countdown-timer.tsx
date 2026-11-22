"use client";

import { Clock } from "lucide-react";
import { cn } from "@open-lms/ui";
import { useCountdown, type CountdownUrgency } from "./use-countdown";

const TONE_CLASSES: Record<CountdownUrgency, string> = {
  safe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  urgent: "border-danger/40 bg-danger/10 text-danger animate-pulse",
  expired: "border-border bg-muted text-muted-foreground",
};

export function CountdownTimer({
  deadlineAt,
  size = "sm",
  showPrefix = true,
  className,
}: {
  deadlineAt: string;
  size?: "sm" | "lg";
  showPrefix?: boolean;
  className?: string;
}) {
  const cd = useCountdown(deadlineAt);

  if (!cd.mounted) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 font-mono tabular-nums text-muted-foreground",
          size === "lg" ? "px-3.5 py-1.5 text-[14px] font-semibold" : "px-2.5 py-0.5 text-[12px] font-medium",
          className,
        )}
      >
        <Clock className={size === "lg" ? "size-4" : "size-3.5"} aria-hidden />
        <span>Memuat...</span>
      </span>
    );
  }

  return (
    <span
      data-testid="countdown-timer"
      data-urgency={cd.urgency}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono tabular-nums",
        TONE_CLASSES[cd.urgency],
        size === "lg" ? "px-3.5 py-1.5 text-[14px] font-semibold" : "px-2.5 py-0.5 text-[12px] font-medium",
        className,
      )}
    >
      <Clock className={size === "lg" ? "size-4 shrink-0" : "size-3.5 shrink-0"} aria-hidden />
      <span>
        {!cd.expired && showPrefix ? "Sisa " : ""}
        {cd.label}
      </span>
    </span>
  );
}
