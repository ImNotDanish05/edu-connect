"use client";

import { EDUCATION_LEVELS, EDUCATION_LEVEL_LABELS, type EducationLevel } from "@open-lms/types";
import { cn } from "@open-lms/ui";

export function LevelChips({
  levels,
  className,
}: {
  levels: EducationLevel[];
  className?: string;
}) {
  if (!levels.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {levels.map((lvl) => (
        <span
          key={lvl}
          className="inline-flex items-center rounded-md border border-border bg-ground-2 px-2 py-0.5 text-[11.5px] font-medium text-foreground"
        >
          {EDUCATION_LEVEL_LABELS[lvl] ?? lvl}
        </span>
      ))}
    </div>
  );
}

export function LevelFilterPills({
  value,
  onChange,
  className,
}: {
  value: EducationLevel | "";
  onChange: (next: EducationLevel | "") => void;
  className?: string;
}) {
  const options: { value: EducationLevel | ""; label: string }[] = [
    { value: "", label: "Semua Jenjang" },
    ...EDUCATION_LEVELS.map((l) => ({ value: l, label: EDUCATION_LEVEL_LABELS[l] })),
  ];
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Filter jenjang">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value || "ALL"}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            data-testid={`level-pill-${opt.value || "all"}`}
            className={cn(
              "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
