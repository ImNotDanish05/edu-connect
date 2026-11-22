"use client";

import type { DonationStatus, KitboxRequestStatus, MentorSessionStatus, OpportunityStatus } from "@open-lms/types";
import { cn } from "@open-lms/ui";

type AnyStatus = MentorSessionStatus | KitboxRequestStatus | DonationStatus | OpportunityStatus;

const STATUS_META: Record<AnyStatus, { label: string; className: string }> = {
  // Mentor sessions
  PENDING: { label: "Menunggu Konfirmasi", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  CONFIRMED: { label: "Dikonfirmasi", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  COMPLETED: { label: "Selesai", className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  DECLINED: { label: "Ditolak Mentor", className: "border-danger/30 bg-danger/10 text-danger" },
  CANCELED: { label: "Dibatalkan", className: "border-border bg-muted text-muted-foreground" },

  // KitBox requests
  SUBMITTED: { label: "Diajukan", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  APPROVED: { label: "Disetujui", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  SHIPPED: { label: "Sedang Dikirim", className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  DELIVERED: { label: "Diterima Siswa", className: "border-emerald-600/30 bg-emerald-600/15 text-emerald-800 dark:text-emerald-200" },
  REJECTED: { label: "Ditolak", className: "border-danger/30 bg-danger/10 text-danger" },

  // KitBox donations
  PLEDGED: { label: "Menunggu Penyerahan", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  RECEIVED: { label: "Diterima Tim KitBox", className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  DISTRIBUTED: { label: "Telah Disalurkan", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },

  // Opportunities
  DRAFT: { label: "Draf", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  PUBLISHED: { label: "Tayang", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  ARCHIVED: { label: "Diarsipkan", className: "border-border bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const meta = STATUS_META[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" };
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold", meta.className, className)}
    >
      {meta.label}
    </span>
  );
}
