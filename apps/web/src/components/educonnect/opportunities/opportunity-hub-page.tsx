"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, Bookmark, MapPin, Search, Trophy } from "lucide-react";
import type { EducationLevel, OpportunityCard as OpportunityCardDto, OpportunityKind } from "@open-lms/types";
import { Button, EmptyState, Input, Skeleton, cn } from "@open-lms/ui";
import { UnderlineTabs } from "@/components/common/underline-tabs";
import { BookmarkToggle } from "@/components/educonnect/common/bookmark-toggle";
import { CountdownTimer } from "@/components/educonnect/common/countdown-timer";
import { LevelChips, LevelFilterPills } from "@/components/educonnect/common/level-chips";
import { VerifiedBadge } from "@/components/educonnect/common/verified-badge";
import { Page, PageHeader } from "@/components/shell/layouts";
import { useEduconnectCounts, useOpportunities } from "@/lib/educonnect/hooks";

type KindTab = "ALL" | OpportunityKind;

const KIND_TABS: { value: KindTab; label: string }[] = [
  { value: "ALL", label: "Semua Peluang" },
  { value: "SCHOLARSHIP", label: "Beasiswa" },
  { value: "COMPETITION", label: "Lomba & Olimpiade" },
];

export function OpportunityHubPage() {
  const [kind, setKind] = useState<KindTab>("ALL");
  const [level, setLevel] = useState<EducationLevel | "">("");
  const [q, setQ] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);

  const list = useOpportunities({ kind, level, q, savedOnly });
  const counts = useEduconnectCounts();
  const savedCount = counts.data?.savedOpportunities ?? 0;

  return (
    <Page>
      <PageHeader
        title="Opportunity Hub - Beasiswa & Lomba"
        lead="Katalog beasiswa pendidikan, olimpiade sains, dan kompetisi terverifikasi untuk siswa SD, SMP, SMA, hingga Kuliah."
        actions={
          <Button
            variant={savedOnly ? "primary" : "outline"}
            onClick={() => setSavedOnly((v) => !v)}
            data-testid="filter-saved-only"
          >
            <Bookmark className={cn("size-4", savedOnly && "fill-current")} />
            <span>Tersimpan ({savedCount})</span>
          </Button>
        }
      />

      <UnderlineTabs label="Jenis peluang" tabs={KIND_TABS} value={kind} onChange={setKind} />

      <div className="mt-6 space-y-6">
        <div className="space-y-3 rounded-card border border-border bg-card p-4 shadow-card">
          <LevelFilterPills value={level} onChange={setLevel} />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama beasiswa, olimpiade, penyelenggara (mis. Kemendikbud, FEB UNDIP), atau topik..."
              aria-label="Cari peluang"
              className="pl-10"
              data-testid="opportunity-search"
            />
          </div>
        </div>

        {list.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-60 rounded-card" />
            ))}
          </div>
        ) : !list.data?.length ? (
          <EmptyState
            icon={<Trophy />}
            title="Belum ada peluang yang sesuai filter"
            description="Peluang yang sudah melewati batas waktu pendaftaran disembunyikan otomatis dari katalog publik."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setKind("ALL");
                  setLevel("");
                  setQ("");
                  setSavedOnly(false);
                }}
              >
                Tampilkan Semua Peluang Aktif
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2" data-testid="opportunity-grid">
            {list.data.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

export function OpportunityCard({ opportunity: o }: { opportunity: OpportunityCardDto }) {
  const isScholarship = o.kind === "SCHOLARSHIP";
  return (
    <article
      data-testid={`opportunity-card-${o.slug}`}
      className="flex flex-col justify-between rounded-card border border-border bg-card p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
                isScholarship
                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                  : "bg-amber-500/15 text-amber-800 dark:text-amber-300",
              )}
            >
              {isScholarship ? <Award className="size-3.5" aria-hidden /> : <Trophy className="size-3.5" aria-hidden />}
              <span>{isScholarship ? "Beasiswa" : "Lomba & Kompetisi"}</span>
            </span>
            {o.isVerified ? <VerifiedBadge compact /> : null}
          </div>

          <div className="flex items-center gap-1.5">
            <CountdownTimer deadlineAt={o.deadlineAt} />
            <BookmarkToggle slugOrId={o.slug} saved={o.saved} title={o.title} />
          </div>
        </div>

        <div>
          <Link
            href={`/opportunities/${encodeURIComponent(o.slug)}`}
            className="font-display text-[18px] font-semibold leading-snug tracking-[-0.01em] hover:text-primary"
          >
            {o.title}
          </Link>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">{o.organizer}</p>
        </div>

        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">{o.summary}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <LevelChips levels={o.educationLevels} />
          {o.location ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {o.location}
            </span>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/opportunities/${encodeURIComponent(o.slug)}`}>Detail & Syarat</Link>
        </Button>
      </div>
    </article>
  );
}
