"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Compatibility } from "@open-lms/types";
import { Tooltip, cn } from "@open-lms/ui";

export function CompatibilityMeter({
  compatibility,
  showReasons = false,
  className,
}: {
  compatibility: Compatibility | null;
  showReasons?: boolean;
  className?: string;
}) {
  if (!compatibility) {
    return (
      <Link
        href="/account/profile"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-muted/50 px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:border-primary hover:text-foreground",
          className,
        )}
      >
        <Sparkles className="size-3.5 text-primary" aria-hidden />
        <span>Lengkapi profil untuk skor kecocokan</span>
      </Link>
    );
  }

  const { score, reasons } = compatibility;
  const tone =
    score >= 80
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : score >= 55
        ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  const pill = (
    <span
      data-testid="compatibility-score"
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold tabular-nums", tone, className)}
    >
      <Sparkles className="size-3.5 shrink-0" aria-hidden />
      <span>{score}% Cocok</span>
    </span>
  );

  if (!showReasons) {
    return reasons.length > 0 ? <Tooltip content={reasons.join(" · ")}>{pill}</Tooltip> : pill;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {pill}
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-sky-500" : "bg-amber-500")}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      {reasons.length > 0 ? (
        <ul className="space-y-1 text-[12.5px] text-muted-foreground">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
