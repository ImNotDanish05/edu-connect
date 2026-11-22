"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gift, Search, Trophy, Users } from "lucide-react";
import type { LearningEntry } from "@open-lms/types";
import { Button, Input, Skeleton } from "@open-lms/ui";
import { CourseCover } from "@/components/course/course-cover";
import { ProgressLine } from "@/components/course/progress-line";
import { MentorDirectoryCard } from "@/components/educonnect/mentors/mentor-directory-page";
import { OpportunityCard } from "@/components/educonnect/opportunities/opportunity-hub-page";
import { ProfileCompletionBanner } from "@/components/educonnect/profile/profile-completion-banner";
import { FullWidth } from "@/components/shell/layouts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { catalogHref } from "@/lib/catalog-filters";
import { learnHref } from "@/lib/course-access";
import { useDisplayCurrency } from "@/lib/currency";
import { useMentors, useOpportunities } from "@/lib/educonnect/hooks";
import { useSaveCourse } from "@/lib/hooks/use-save-course";
import { useAcademyMeta, useProductName } from "@/lib/meta";
import { qk } from "@/lib/query-keys";
import { CourseRail, RailCell, RailTrack } from "./course-rail";

/** The home page: hero, continue learning, EduConnect mentor & opportunity rails, catalog shelves, categories and how it works. */
export function HomePage() {
  const { status } = useAuth();
  const { currency, ready } = useDisplayCurrency();
  const { toggle } = useSaveCourse();
  const shelves = useQuery({
    queryKey: qk.featured(currency ?? ""),
    queryFn: () => api().catalog.featured(currency),
    enabled: ready && status !== "loading",
  });
  const shelfLoading = shelves.isPending;

  return (
    <FullWidth>
      <Hero />
      <div className="mx-auto w-full max-w-[1200px] space-y-16 px-4 pb-20 pt-6 sm:px-6">
        <ProfileCompletionBanner />
        {status === "signed-in" ? <ContinueLearning /> : null}
        <TopMentorsRail />
        <UpcomingDeadlinesRail />
        <CourseRail title="Featured" lead="Picked by the academy." courses={shelves.data?.featured} loading={shelfLoading} href="/courses" hrefLabel="All courses" onToggleSave={toggle} testId="rail-featured" />
        <CourseRail title="Popular" lead="What most learners are taking." courses={shelves.data?.popular} loading={shelfLoading} href={catalogHref({ sort: "popular" })} onToggleSave={toggle} testId="rail-popular" />
        <Categories />
        <CourseRail title="New" lead="Recently published." courses={shelves.data?.newest} loading={shelfLoading} href={catalogHref({ sort: "newest" })} onToggleSave={toggle} testId="rail-new" />
        <CourseRail title="Free" lead="Start without paying anything." courses={shelves.data?.free} loading={shelfLoading} href={catalogHref({ price: "free" })} onToggleSave={toggle} testId="rail-free" />
        {shelves.isError ? <p className="text-[14px] text-muted-foreground">The course list did not load. Refresh the page to try again.</p> : null}
        <HowItWorks />
      </div>
    </FullWidth>
  );
}

function TopMentorsRail() {
  const mentors = useMentors({ sort: "match" });
  const top3 = (mentors.data ?? []).slice(0, 3);
  if (!top3.length) return null;

  return (
    <section aria-labelledby="home-mentors-title" data-testid="rail-top-mentors">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="home-mentors-title" className="font-display text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
            Mentor Paling Cocok Untukmu
          </h2>
          <p className="mt-1 text-[14.5px] text-muted-foreground">
            Rekomendasi kakak tingkat & mahasiswa berprestasi berdasarkan jenjang dan minat belajarmu.
          </p>
        </div>
        <Link href="/mentors" className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-link hover:underline">
          <span>Lihat Semua Mentor</span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {top3.map((m) => (
          <MentorDirectoryCard key={m.id} mentor={m} />
        ))}
      </div>
    </section>
  );
}

function UpcomingDeadlinesRail() {
  const opps = useOpportunities({ kind: "ALL" });
  const top3 = (opps.data ?? []).slice(0, 3);
  if (!top3.length) return null;

  return (
    <section aria-labelledby="home-deadlines-title" data-testid="rail-upcoming-deadlines">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="home-deadlines-title" className="font-display text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
            Beasiswa & Lomba - Deadline Terdekat
          </h2>
          <p className="mt-1 text-[14.5px] text-muted-foreground">
            Jangan lewatkan peluang terverifikasi yang segera ditutup pendaftarannya.
          </p>
        </div>
        <Link href="/opportunities" className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-link hover:underline">
          <span>Buka Opportunity Hub</span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {top3.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} />
        ))}
      </div>
    </section>
  );
}

function Hero() {
  const router = useRouter();
  const { data: meta, isPending } = useAcademyMeta();
  const name = useProductName();
  const [q, setQ] = useState("");
  return (
    <section className="border-b border-border bg-ground-2">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end lg:pb-20 lg:pt-24">
        <div className="min-w-0 animate-rise">
          <p className="mb-4 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">{name}</p>
          {isPending ? (
            <Skeleton className="h-14 w-4/5" />
          ) : (
            <h1 className="text-balance font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[56px] lg:text-[64px]">
              {meta?.tagline?.trim() || "Belajar Terarah, Mentoring 1-on-1 & Raih Beasiswa Impian."}
            </h1>
          )}
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
            Platform terpadu untuk pelajar SD, SMP, SMA, hingga Kuliah: modul terkurasi, bimbingan langsung bersama mentor mahasiswa berprestasi, info beasiswa & olimpiade, serta gerakan berbagi KitBox gratis.
          </p>
        </div>
        <div className="min-w-0 animate-rise [animation-delay:80ms]">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(catalogHref({ q: q.trim() || undefined }));
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Mau belajar topik apa hari ini?"
              aria-label="Search courses"
              className="h-14 rounded-[12px] pl-12 text-[15.5px]"
              data-testid="home-search"
            />
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button asChild size="lg" data-testid="home-browse">
              <Link href="/courses">Jelajahi Modul</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/mentors">
                <Users className="size-4" />
                <span>Cari Mentor</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/opportunities">
                <Trophy className="size-4" />
                <span>Beasiswa & Lomba</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/kitbox">
                <Gift className="size-4 text-primary" />
                <span>KitBox Gratis</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContinueLearning() {
  const q = useQuery({
    queryKey: [...qk.myLearning("in_progress"), "home"],
    queryFn: () => api().my.learning({ status: "in_progress", limit: 4 }),
    meta: { silent: true },
  });
  if (q.isError) return null;
  const items = q.data?.items.filter((e) => e.active) ?? [];
  if (q.data && items.length === 0) return null;
  return (
    <section className="animate-rise" aria-labelledby="continue-title" data-testid="continue-learning">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="continue-title" className="font-display text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
          Continue learning
        </h2>
        <Link href="/my-learning" className="inline-flex items-center gap-1 text-[14px] font-semibold text-link hover:underline">
          Belajarku <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <RailTrack>
        {q.isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <RailCell key={i} index={i}>
                <div className="overflow-hidden rounded-card bg-card shadow-card" aria-hidden>
                  <div className="aspect-[16/7] animate-shimmer bg-muted" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                </div>
              </RailCell>
            ))
          : items.map((e, i) => (
              <RailCell key={e.enrollmentId} index={i}>
                <ResumeCard entry={e} />
              </RailCell>
            ))}
      </RailTrack>
    </section>
  );
}

function ResumeCard({ entry }: { entry: LearningEntry }) {
  const c = entry.course;
  return (
    <Link
      href={learnHref(c.slug, entry.resumeItem?.id)}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="resume-card"
    >
      <CourseCover src={c.coverUrl} title={c.title} seed={c.slug} size="sm" className="aspect-[16/7]" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-[16px] font-semibold leading-snug">{c.title}</h3>
        {entry.resumeItem ? <p className="line-clamp-1 text-[13px] text-muted-foreground">Next: {entry.resumeItem.title}</p> : null}
        <ProgressLine className="mt-auto pt-1" percent={entry.progressPercent} completed={entry.completedItems} total={entry.totalItems} showEmpty />
      </div>
    </Link>
  );
}

function Categories() {
  const q = useQuery({ queryKey: qk.categories, queryFn: () => api().catalog.categories(), staleTime: 5 * 60_000, meta: { silent: true } });
  const cats = (q.data ?? []).filter((c) => c.courseCount > 0);
  if (!cats.length) return null;
  return (
    <section className="animate-rise border-y border-border py-8" aria-labelledby="categories-title" data-testid="home-categories">
      <h2 id="categories-title" className="mb-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-subtle-foreground">
        Browse by topic
      </h2>
      <ul className="flex flex-wrap gap-x-8 gap-y-3">
        {cats.map((c) => (
          <li key={c.id}>
            <Link href={catalogHref({ category: c.slug })} className="group inline-flex items-baseline gap-1.5 font-display text-[19px] font-semibold tracking-[-0.01em] text-foreground hover:text-primary sm:text-[22px]">
              {c.name}
              <span className="font-sans text-[13px] font-medium tabular-nums text-subtle-foreground">{c.courseCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  { title: "1. Profil & Jenjang", body: "Tentukan jenjang pendidikan (SD/SMP/SMA/Kuliah), minat bidang studi, dan target belajarmu." },
  { title: "2. Modul Terkurasi", body: "Pelajari video materi, artikel, dan kuis interaktif secara bertahap sesuai kurikulum." },
  { title: "3. Mentor 1-on-1", body: "Cocokkan profilmu dengan kakak tingkat & mahasiswa berprestasi untuk sesi konsultasi langsung." },
  { title: "4. Peluang & KitBox", body: "Pantau hitung mundur beasiswa & olimpiade, serta ajukan atau donasikan perlengkapan belajar di KitBox." },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="animate-rise" data-testid="home-how">
      <h2 id="how-title" className="font-display text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
        4 Pilar EduConnect
      </h2>
      <ol className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="border-t border-border pt-5">
            <p className="text-[12.5px] font-semibold tabular-nums text-subtle-foreground">Pilar {i + 1}</p>
            <h3 className="mt-1 font-display text-[19px] font-semibold tracking-[-0.01em]">{s.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
