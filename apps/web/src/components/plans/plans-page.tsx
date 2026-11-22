"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { BillingInterval, Plan, SubscriptionSummary } from "@open-lms/types";
import { Button, EmptyState, Skeleton, cn } from "@open-lms/ui";
import { CurrencyMenu } from "@/components/catalog/currency-menu";
import { ErrorState } from "@/components/common/states";
import { UnderlineTabs } from "@/components/common/underline-tabs";
import { Page, PageHeader } from "@/components/shell/layouts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { availableIntervals, dateOnly, planPricing } from "@/lib/billing";
import { checkoutUrl } from "@/lib/checkout";
import { useDisplayCurrency } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { qk } from "@/lib/query-keys";

const PLAN_NAME_ID: Record<string, string> = {
  "All-Access": "Paket Akses Penuh (All-Access)",
};

const PLAN_DESC_ID: Record<string, string> = {
  "Every course in the catalog, including the members-only ones, for as long as you are subscribed.":
    "Akses penuh ke seluruh modul di katalog, termasuk modul eksklusif khusus pelanggan, selama masa langgananmu aktif.",
};

const PLAN_FEATURE_ID: Record<string, string> = {
  "Every current and future course": "Akses semua modul saat ini dan modul baru mendatang",
  "Members-only courses": "Termasuk modul eksklusif khusus pelanggan",
  "Certificates for everything you finish": "Sertifikat kelulusan untuk setiap modul yang diselesaikan",
  "Cancel any time": "Bebas batalkan kapan saja tanpa penalti",
};

function translatePlanName(name: string): string {
  return PLAN_NAME_ID[name] ?? name;
}

function translatePlanDesc(desc: string | null | undefined): string | null {
  if (!desc) return null;
  return PLAN_DESC_ID[desc] ?? desc;
}

function translatePlanFeature(feature: string): string {
  return PLAN_FEATURE_ID[feature] ?? feature;
}

function subscriptionStatusId(sub: SubscriptionSummary): { status: string; dateLine: string | null } {
  const end = sub.currentPeriodEnd ? dateOnly(sub.currentPeriodEnd, "id-ID") : null;
  const trialEnd = sub.trialEnd ? dateOnly(sub.trialEnd, "id-ID") : end;
  const price = `${formatMoney(sub.price)} per ${sub.interval === "YEAR" ? "tahun" : "bulan"}`;
  switch (sub.status) {
    case "TRIALING":
      return sub.cancelAtPeriodEnd
        ? { status: "Uji coba gratis", dateLine: trialEnd ? `Uji coba berakhir pada ${trialEnd} dan tidak diperpanjang` : "Uji coba tidak diperpanjang" }
        : { status: "Uji coba gratis", dateLine: trialEnd ? `Uji coba berakhir pada ${trialEnd}, selanjutnya ${price}` : `Selanjutnya ${price}` };
    case "ACTIVE":
      return sub.cancelAtPeriodEnd
        ? { status: "Segera berakhir", dateLine: end ? `Berakhir pada ${end}` : null }
        : { status: "Aktif", dateLine: end ? `Diperpanjang pada ${end} (${price})` : `Diperpanjang seharga ${price}` };
    case "PAST_DUE":
      return { status: "Pembayaran tertunda", dateLine: end ? `Tagihan jatuh tempo sejak ${end}` : null };
    case "CANCELED":
      return { status: "Dibatalkan", dateLine: end ? `Akses hingga ${end}` : null };
    case "EXPIRED":
      return { status: "Kedaluwarsa", dateLine: end ? `Berakhir pada ${end}` : null };
    default:
      return { status: "Menunggu pembayaran", dateLine: null };
  }
}

export function PlansPage() {
  return (
    <Suspense fallback={<PlansSkeleton />}>
      <Plans />
    </Suspense>
  );
}

function Plans() {
  const { currency, ready } = useDisplayCurrency();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = useQuery({
    queryKey: qk.plans(currency ?? ""),
    queryFn: () => api().checkout.plans(currency),
    enabled: ready,
    placeholderData: (prev) => prev,
  });
  const plans = q.data ?? [];
  const intervals = availableIntervals(plans);
  const wanted: BillingInterval = params.get("interval") === "year" ? "YEAR" : "MONTH";
  const interval: BillingInterval = intervals.includes(wanted) ? wanted : (intervals[0] ?? "MONTH");
  const sub = user?.subscription ?? null;

  const setInterval = (i: BillingInterval) => {
    const p = new URLSearchParams(params.toString());
    if (i === "YEAR") p.set("interval", "year");
    else p.delete("interval");
    router.replace(`${pathname}${p.size ? `?${p.toString()}` : ""}`, { scroll: false });
  };

  return (
    <Page>
      <PageHeader
        title="Paket"
        lead="Satu langganan membuka seluruh modul yang termasuk dalam paket. Bebas batalkan kapan saja; progres belajar dan sertifikatmu tetap menjadi milikmu."
        actions={<CurrencyMenu />}
      />
      {sub ? <CurrentPlan sub={sub} /> : null}
      {q.isPending || !ready ? (
        <PlansSkeleton bare />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="Belum ada paket langganan saat ini"
          description="Modul pembelajaran tetap dapat dibeli secara satuan."
          action={
            <Button asChild variant="outline">
              <Link href="/courses">Jelajahi modul</Link>
            </Button>
          }
        />
      ) : (
        <>
          {intervals.length > 1 ? (
            <UnderlineTabs
              label="Periode tagihan"
              className="mb-8 border-b-0"
              value={interval}
              onChange={setInterval}
              tabs={[
                { value: "MONTH", label: "Bulanan" },
                { value: "YEAR", label: "Tahunan" },
              ]}
            />
          ) : null}
          <div className={cn("grid gap-y-10 border-t border-border pt-8", plans.length > 1 && "md:grid-cols-2 md:divide-x md:divide-border", plans.length > 2 && "lg:grid-cols-3")} data-testid="plans-list">
            {plans.map((p, i) => (
              <PlanColumn key={p.id} plan={p} interval={interval} currency={currency} sub={sub} first={i === 0} single={plans.length === 1} />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}

function CurrentPlan({ sub }: { sub: SubscriptionSummary }) {
  const copy = subscriptionStatusId(sub);
  return (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-y border-border py-4" data-testid="plans-current">
      <p className="text-[14.5px]">
        Kamu sedang berlangganan <span className="font-semibold">{translatePlanName(sub.plan.name)}</span>
        <span className="text-muted-foreground"> · {copy.status}{copy.dateLine ? ` · ${copy.dateLine}` : ""}</span>
      </p>
      <Link href="/account/subscription" className="text-[14px] font-semibold text-link hover:underline" data-testid="plans-manage">
        Kelola
      </Link>
    </div>
  );
}

function PlanColumn({ plan, interval, currency, sub, first, single }: { plan: Plan; interval: BillingInterval; currency?: string; sub: SubscriptionSummary | null; first: boolean; single?: boolean }) {
  const pricing = planPricing(plan, interval);
  const current = sub?.plan.id === plan.id;
  const href = checkoutUrl({ type: "PLAN", id: plan.id, interval }, pricing.price?.price.currency ?? currency);
  const description = translatePlanDesc(plan.description);
  return (
    <section className={cn("flex flex-col md:px-8", first && "md:pl-0", single && "max-w-[520px]")} data-testid={`plan-${plan.slug}`} aria-labelledby={`plan-${plan.id}-name`}>
      <h2 id={`plan-${plan.id}-name`} className="font-display text-[24px] font-semibold tracking-[-0.02em]">
        {translatePlanName(plan.name)}
      </h2>
      {description ? <p className="mt-2 text-[15px] text-muted-foreground">{description}</p> : null}
      <div className="mt-5 min-h-[76px]">
        {pricing.price ? (
          <>
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-[36px] font-semibold tracking-[-0.02em] tabular-nums">{formatMoney(pricing.price.price, { compact: true })}</span>
              <span className="text-[14px] text-muted-foreground">per {interval === "YEAR" ? "tahun" : "bulan"}</span>
            </p>
            {pricing.perMonth ? (
              <p className="mt-1 text-[13.5px] text-muted-foreground" data-testid="plan-yearly-note">
                Sekitar {formatMoney(pricing.perMonth)} per bulan
                {pricing.savingPercent && pricing.saving ? `, lebih hemat ${pricing.savingPercent}% dibanding bayar bulanan (hemat ${formatMoney(pricing.saving, { compact: true })} per tahun)` : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[14px] text-muted-foreground">Tidak tersedia untuk tagihan {interval === "YEAR" ? "tahunan" : "bulanan"} dalam {currency}. Silakan coba mata uang atau periode tagihan lain.</p>
        )}
      </div>
      {plan.trialDays > 0 && !sub ? <p className="mt-2 text-[13.5px] font-medium text-primary">Uji coba gratis {plan.trialDays} hari. Kamu tidak akan dikenakan biaya sebelum masa uji coba berakhir.</p> : null}
      <div className="mt-5">
        {current ? (
          <Button asChild variant="outline" block data-testid="plan-manage">
            <Link href="/account/subscription">Kelola paketmu</Link>
          </Button>
        ) : sub ? (
          <p className="text-[13.5px] text-muted-foreground">Kamu sudah memiliki paket aktif. Batalkan paket saat ini terlebih dahulu untuk berpindah paket.</p>
        ) : pricing.price ? (
          <Button asChild variant={first ? "primary" : "outline"} block size="lg" data-testid="plan-cta">
            <Link href={href}>{plan.trialDays > 0 ? "Mulai uji coba gratis" : "Berlangganan sekarang"}</Link>
          </Button>
        ) : null}
      </div>
      {plan.includedCourseCount > 0 || plan.features.length ? (
        <ul className="mt-6 space-y-2.5 text-[14.5px]">
          {plan.includedCourseCount > 0 ? (
            <li className="flex gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {plan.includedCourseCount} modul termasuk dalam paket
            </li>
          ) : null}
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {translatePlanFeature(f)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PlansSkeleton({ bare }: { bare?: boolean }) {
  const body = (
    <div className="grid gap-10 border-t border-border pt-8 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
  if (bare) return body;
  return (
    <Page>
      <PageHeader title="Paket" />
      {body}
    </Page>
  );
}
