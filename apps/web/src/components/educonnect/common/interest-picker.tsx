"use client";

import { Check } from "lucide-react";
import { INTEREST_TAGS, INTEREST_TAG_LABELS, type InterestTag } from "@open-lms/types";
import { cn } from "@open-lms/ui";

export function InterestPicker({
  value,
  onChange,
  max = 10,
  className,
}: {
  value: InterestTag[];
  onChange: (next: InterestTag[]) => void;
  max?: number;
  className?: string;
}) {
  const selected = new Set(value);

  const toggle = (tag: InterestTag) => {
    if (selected.has(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else if (value.length < max) {
      onChange([...value, tag]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih minat belajar">
        {INTEREST_TAGS.map((tag) => {
          const isSelected = selected.has(tag);
          const disabled = !isSelected && value.length >= max;
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggle(tag)}
              aria-pressed={isSelected}
              data-testid={`interest-tag-${tag}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "cursor-not-allowed opacity-45",
              )}
            >
              {isSelected ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
              <span>{INTEREST_TAG_LABELS[tag]}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-muted-foreground">
        Dipilih: <span className="font-semibold text-foreground">{value.length}</span> / {max} minat
      </p>
    </div>
  );
}
