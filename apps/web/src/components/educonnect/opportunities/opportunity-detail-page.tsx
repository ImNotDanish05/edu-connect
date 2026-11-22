"use client";

import Link from "next/link";
import { ArrowLeft, Award, Calendar, CheckCircle2, ExternalLink, MapPin, Sparkles, Trophy } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@open-lms/ui";
import { BookmarkToggle } from "@/components/educonnect/common/bookmark-toggle";
import { CountdownTimer } from "@/components/educonnect/common/countdown-timer";
import { LevelChips } from "@/components/educonnect/common/level-chips";
import { VerifiedBadge } from "@/components/educonnect/common/verified-badge";
import { Page } from "@/components/shell/layouts";
import { useOpportunityDetail } from "@/lib/educonnect/hooks";
import { formatWibDateTime } from "@/lib/educonnect/mentor-slots";

export function OpportunityDetailPage({ slug }: { slug: string }) {
  const q = useOpportunityDetail(slug);

  if (q.isPending) {
    return (
      <Page>
        <Skeleton className="h-72 rounded-card" />
      </Page>
    );
  }

  const o = q.data;
  if (!o) {
    return (
      <Page>
        <EmptyState
          title="Peluang tidak ditemukan"
          description="Halaman beasiswa atau kompetisi ini tidak tersedia."
          action={
            <Button asChild>
              <Link href="/opportunities">Kembali ke Opportunity Hub</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  const isScholarship = o.kind === "SCHOLARSHIP";
  const isExpired = Date.parse(o.deadlineAt) <= Date.now();

  return (
    <Page>
      <div className="mb-5">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span>Kembali ke Opportunity Hub</span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12.5px] font-semibold text-primary">
                {isScholarship ? <Award className="size-4" aria-hidden /> : <Trophy className="size-4" aria-hidden />}
                <span>{isScholarship ? "Beasiswa Pendidikan" : "Lomba & Kompetisi"}</span>
              </span>
              {o.isVerified ? <VerifiedBadge /> : null}
              <LevelChips levels={o.educationLevels} />
            </div>

            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">
              {o.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-muted-foreground">
              <span className="font-semibold text-foreground">{o.organizer}</span>
              {o.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {o.location}
                </span>
              ) : null}
              <span>Disimpan oleh {o.saveCount} siswa</span>
            </div>

            <p className="border-t border-border pt-4 text-[15px] leading-relaxed text-foreground">{o.summary}</p>
          </section>

          <section className="rounded-card border border-border bg-card p-6 shadow-card space-y-6">
            <div>
              <h2 className="font-display text-[19px] font-semibold">Deskripsi Lengkap</h2>
              <div
                className="prose prose-sm mt-3 max-w-none space-y-3 text-[14.5px] leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: o.descriptionHtml }}
              />
            </div>

            {o.requirements.length > 0 ? (
              <div className="border-t border-border pt-5">
                <h2 className="font-display text-[19px] font-semibold">Persyaratan Pendaftaran</h2>
                <ul className="mt-3 space-y-2 text-[14.5px]">
                  {o.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2.5 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {o.benefits.length > 0 ? (
              <div className="border-t border-border pt-5">
                <h2 className="font-display text-[19px] font-semibold">Cakupan Beasiswa & Hadiah</h2>
                <ul className="mt-3 space-y-2 text-[14.5px]">
                  {o.benefits.map((ben) => (
                    <li key={ben} className="flex items-start gap-2.5 text-muted-foreground">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                      <span>{ben}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="sticky top-20 rounded-card border border-border bg-card p-5 shadow-card space-y-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Batas Waktu Pendaftaran
            </p>
            <div className="mt-2">
              <CountdownTimer deadlineAt={o.deadlineAt} size="lg" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              <span>Penutupan: {formatWibDateTime(o.deadlineAt)}</span>
            </p>
          </div>

          <div className="space-y-2.5 border-t border-border pt-4">
            <Button asChild size="lg" className="w-full" disabled={isExpired}>
              <a
                href={o.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="opportunity-register-link"
              >
                <span>{isExpired ? "Pendaftaran Ditutup" : "Daftar di Website Resmi"}</span>
                <ExternalLink className="size-4" />
              </a>
            </Button>
            <BookmarkToggle
              slugOrId={o.slug}
              saved={o.saved}
              title={o.title}
              variant="button"
              className="w-full"
            />
          </div>

          <div className="rounded-lg border border-border bg-ground-2 p-3.5 text-[12.5px] text-muted-foreground">
            <p className="font-semibold text-foreground">Butuh bimbingan persiapan?</p>
            <p className="mt-1">
              Diskusikan strategi lomba atau minta review esai beasiswamu bersama mentor 1-on-1 EduConnect.
            </p>
            <Link href="/mentors" className="mt-2 inline-block font-semibold text-link hover:underline">
              Cari Mentor Pendamping →
            </Link>
          </div>
        </aside>
      </div>
    </Page>
  );
}
