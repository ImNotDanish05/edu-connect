"use client";

import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import { EDUCATION_LEVEL_LABELS, INTEREST_TAG_LABELS } from "@open-lms/types";
import { Button, cn } from "@open-lms/ui";
import { useStudentProfile } from "@/lib/educonnect/hooks";

export function ProfileCompletionBanner({ className }: { className?: string }) {
  const { data: profile } = useStudentProfile();

  const isComplete = !!profile?.educationLevel && (profile?.interests?.length ?? 0) > 0;

  if (!isComplete) {
    return (
      <div
        data-testid="profile-completion-banner"
        className={cn(
          "flex flex-col justify-between gap-4 rounded-card border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-display text-[15.5px] font-semibold text-foreground">
              Lengkapi profil belajarmu agar rekomendasi & skor kecocokan mentor lebih akurat
            </p>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              Pilih jenjang pendidikan (SD/SMP/SMA/Kuliah), minat bidang studi, dan target belajarmu.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/account/profile">Lengkapi Profil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      data-testid="profile-active-banner"
      className={cn(
        "flex flex-col justify-between gap-3 rounded-card border border-border bg-ground-2 px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <GraduationCap className="size-4 text-primary" aria-hidden />
          Profil Belajar Aktif:
        </span>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
          {EDUCATION_LEVEL_LABELS[profile.educationLevel!]}
          {profile.gradeYear ? ` · Kelas/Sem ${profile.gradeYear}` : ""}
        </span>
        {profile.interests.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-md border border-border bg-card px-2 py-0.5 text-[12px] text-muted-foreground">
            {INTEREST_TAG_LABELS[tag] ?? tag}
          </span>
        ))}
        {profile.interests.length > 4 ? (
          <span className="text-[12px] text-muted-foreground">+{profile.interests.length - 4} lainnya</span>
        ) : null}
      </div>
      <Link href="/account/profile" className="shrink-0 text-[13px] font-semibold text-link hover:underline">
        Ubah Profil Belajar
      </Link>
    </div>
  );
}
