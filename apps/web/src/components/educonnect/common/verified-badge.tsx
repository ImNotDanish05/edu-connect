"use client";

import { BadgeCheck } from "lucide-react";
import { Tooltip, cn } from "@open-lms/ui";

export function VerifiedBadge({
  label = "Terverifikasi",
  tooltip = "Telah diverifikasi oleh Tim Akademik EduConnect",
  compact = false,
  className,
}: {
  label?: string;
  tooltip?: string;
  compact?: boolean;
  className?: string;
}) {
  const pill = (
    <span
      data-testid="verified-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11.5px] font-semibold text-sky-700 dark:text-sky-300",
        className,
      )}
    >
      <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
      {!compact ? <span>{label}</span> : null}
    </span>
  );

  return <Tooltip content={tooltip}>{pill}</Tooltip>;
}
