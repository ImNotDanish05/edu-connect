"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, CalendarCheck, Clock, Search, Sparkles, Users } from "lucide-react";
import type { EducationLevel, MentorCard as MentorCardDto } from "@open-lms/types";
import { Avatar, Button, EmptyState, Input, NativeSelect, Skeleton } from "@open-lms/ui";
import { CompatibilityMeter } from "@/components/educonnect/common/compatibility-meter";
import { LevelChips, LevelFilterPills } from "@/components/educonnect/common/level-chips";
import { VerifiedBadge } from "@/components/educonnect/common/verified-badge";
import { ProfileCompletionBanner } from "@/components/educonnect/profile/profile-completion-banner";
import { Page, PageHeader } from "@/components/shell/layouts";
import { useEduconnectCounts, useMentors } from "@/lib/educonnect/hooks";

const SPECIALTY_OPTIONS = [
  "Akuntansi",
  "Ekonomi",
  "Matematika",
  "Persiapan SNBT",
  "Biologi",
  "Fisika",
  "Coding",
  "Public Speaking",
  "Beasiswa",
  "Business Plan",
];

const formatIdr = (amount: number) =>
  amount <= 0
    ? "Gratis (Relawan)"
    : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function MentorDirectoryPage() {
  const [level, setLevel] = useState<EducationLevel | "">("");
  const [specialty, setSpecialty] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [sort, setSort] = useState<"match" | "popular">("match");

  const mentors = useMentors({ level, specialty, q, sort });
  const counts = useEduconnectCounts();
  const activeCount = (counts.data?.mentorSessions ?? 0) + (counts.data?.pendingSessions ?? 0);

  return (
    <Page>
      <PageHeader
        title="Direktori Mentor 1-on-1"
        lead="Belajar dan konsultasi langsung bersama kakak tingkat & mahasiswa berprestasi yang telah diverifikasi."
        actions={
          <Button asChild variant="outline">
            <Link href="/mentoring" data-testid="go-to-mentoring">
              <CalendarCheck className="size-4" />
              <span>Sesi Mentoring Saya</span>
              {activeCount > 0 ? (
                <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[12px] font-semibold text-primary">
                  {activeCount}
                </span>
              ) : null}
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <ProfileCompletionBanner />

        <div className="space-y-3 rounded-card border border-border bg-card p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <LevelFilterPills value={level} onChange={setLevel} />
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect
                aria-label="Filter spesialisasi"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-44"
                data-testid="mentor-filter-specialty"
              >
                <option value="">Semua Spesialisasi</option>
                {SPECIALTY_OPTIONS.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label="Urutkan mentor"
                value={sort}
                onChange={(e) => setSort(e.target.value as "match" | "popular")}
                className="w-48"
                data-testid="mentor-sort"
              >
                <option value="match">Kecocokan Tertinggi</option>
                <option value="popular">Sesi Terbanyak</option>
              </NativeSelect>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama mentor, universitas (mis. FEB UNDIP, ITB, UI), atau mata pelajaran..."
              aria-label="Cari mentor"
              className="pl-10"
              data-testid="mentor-search"
            />
          </div>
        </div>

        {mentors.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-72 rounded-card" />
            ))}
          </div>
        ) : !mentors.data?.length ? (
          <EmptyState
            icon={<Users />}
            title="Tidak ada mentor yang cocok dengan filter ini"
            description="Coba pilih Semua Jenjang atau hapus kata kunci pencarianmu."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setLevel("");
                  setSpecialty("");
                  setQ("");
                }}
              >
                Reset Filter
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="mentor-grid">
            {mentors.data.map((m) => (
              <MentorDirectoryCard key={m.id} mentor={m} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

export function MentorDirectoryCard({ mentor: m }: { mentor: MentorCardDto }) {
  return (
    <article
      data-testid={`mentor-card-${m.username}`}
      className="flex flex-col justify-between rounded-card border border-border bg-card p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={m.displayName} seed={m.id} src={m.avatarUrl} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/mentors/${encodeURIComponent(m.username)}`}
                  className="truncate font-display text-[17px] font-semibold tracking-[-0.01em] hover:text-primary"
                >
                  {m.displayName}
                </Link>
                {m.isVerified ? <VerifiedBadge compact /> : null}
              </div>
              {m.institution ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] font-medium text-primary">
                  <Building2 className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{m.institution}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <CompatibilityMeter compatibility={m.compatibility} />

        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">{m.headline}</p>

        <div className="flex flex-wrap gap-1.5">
          {m.specialties.slice(0, 4).map((sp) => (
            <span
              key={sp}
              className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-medium text-foreground"
            >
              {sp}
            </span>
          ))}
        </div>

        {m.compatibility && m.compatibility.reasons.length > 0 ? (
          <div className="rounded-lg border border-border/70 bg-ground-2 px-3 py-2 text-[12px] text-muted-foreground">
            <p className="flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="size-3 text-primary" aria-hidden />
              <span>{m.compatibility.reasons[0]}</span>
            </p>
            {m.compatibility.reasons[1] ? <p className="mt-0.5 truncate">• {m.compatibility.reasons[1]}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-3.5">
        <div className="flex items-center justify-between gap-2 text-[12.5px]">
          <LevelChips levels={m.educationLevels} />
          <span className="shrink-0 text-muted-foreground">{m.sessionsCompleted} sesi selesai</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-[15px] font-semibold text-foreground">{formatIdr(m.pricePerSession)}</p>
            <p className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              <span>{m.sessionMinutes} menit / sesi</span>
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/mentors/${encodeURIComponent(m.username)}`} data-testid={`book-mentor-${m.username}`}>
              Lihat Jadwal & Pesan
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
