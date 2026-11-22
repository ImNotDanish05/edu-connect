"use client";

import Link from "next/link";
import { ArrowLeft, Gift, Heart, Package } from "lucide-react";
import type { DonationCondition, DonationDelivery, DonationItemType } from "@open-lms/types";
import { Button, EmptyState, toast } from "@open-lms/ui";
import { StatusBadge } from "@/components/educonnect/common/status-badge";
import { Page, PageHeader } from "@/components/shell/layouts";
import { useCancelKitboxDonation, useCancelKitboxRequest, useMyKitbox } from "@/lib/educonnect/hooks";
import { formatWibDateTime } from "@/lib/educonnect/mentor-slots";

const ITEM_TYPE_LABELS: Record<DonationItemType, string> = {
  BOOK: "Buku / Modul",
  STATIONERY: "Alat Tulis",
  OTHER: "Lainnya",
};

const CONDITION_LABELS: Record<DonationCondition, string> = {
  NEW: "Baru",
  LIKE_NEW: "Seperti Baru",
  GOOD: "Layak Pakai",
};

const DELIVERY_LABELS: Record<DonationDelivery, string> = {
  DROP_POINT: "Drop Point Kampus",
  COURIER: "Kirim Kurir",
  PICKUP: "Jemput Relawan",
};

export function MyKitboxPage() {
  const myKitbox = useMyKitbox();
  const cancelReq = useCancelKitboxRequest();
  const cancelDon = useCancelKitboxDonation();

  const requests = myKitbox.data?.requests ?? [];
  const donations = myKitbox.data?.donations ?? [];

  return (
    <Page>
      <div className="mb-4">
        <Link
          href="/kitbox"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span>Kembali ke Katalog KitBox</span>
        </Link>
      </div>

      <PageHeader
        title="Riwayat Aktivitas KitBox Saya"
        lead="Pantau status pengajuan klaim paket perlengkapan belajar dan riwayat donasi barangmu."
        actions={
          <Button asChild size="sm">
            <Link href="/kitbox">Katalog & Donasi KitBox</Link>
          </Button>
        }
      />

      <div className="space-y-10">
        <section aria-labelledby="my-requests-title" className="space-y-4">
          <h2 id="my-requests-title" className="flex items-center gap-2 font-display text-[20px] font-semibold">
            <Package className="size-5 text-primary" aria-hidden />
            <span>Pengajuan Klaim Paket ({requests.length})</span>
          </h2>

          {!requests.length ? (
            <EmptyState
              compact
              icon={<Gift />}
              title="Belum ada pengajuan klaim KitBox"
              description="Pilih paket perlengkapan belajar gratis di halaman utama KitBox."
            />
          ) : (
            <div className="space-y-3" data-testid="my-kitbox-requests">
              {requests.map((r) => (
                <article key={r.id} className="rounded-card border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[17px] font-semibold">{r.package.name}</h3>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-[13.5px] text-muted-foreground">
                        Penerima: <span className="font-medium text-foreground">{r.recipientName}</span> · Kota: {r.city}
                      </p>
                      <p className="text-[13.5px] text-muted-foreground">Alasan: “{r.reason}”</p>
                      {r.adminNote ? (
                        <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[13px] text-foreground">
                          <span className="font-semibold">Catatan Tim KitBox:</span> {r.adminNote}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
                      <span className="text-[12px] text-muted-foreground">{formatWibDateTime(r.createdAt)}</span>
                      {r.status === "SUBMITTED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            cancelReq.mutate(r.id, {
                              onSuccess: () => toast.info({ title: "Pengajuan klaim dibatalkan" }),
                            })
                          }
                          data-testid={`cancel-request-${r.id}`}
                        >
                          Batalkan Pengajuan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="my-donations-title" className="space-y-4">
          <h2 id="my-donations-title" className="flex items-center gap-2 font-display text-[20px] font-semibold">
            <Heart className="size-5 text-rose-500" aria-hidden />
            <span>Donasi Barang Saya ({donations.length})</span>
          </h2>

          {!donations.length ? (
            <EmptyState
              compact
              icon={<Heart />}
              title="Belum ada riwayat donasi"
              description="Donasikan buku atau alat tulis layak pakai untuk membantu adik-adik pelajar."
            />
          ) : (
            <div className="space-y-3" data-testid="my-kitbox-donations">
              {donations.map((d) => (
                <article key={d.id} className="rounded-card border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-4">
                      {d.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.photoUrl}
                          alt={d.itemDescription}
                          className="size-16 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : null}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-[17px] font-semibold">
                            {d.quantity}× {ITEM_TYPE_LABELS[d.itemType]}
                          </span>
                          <StatusBadge status={d.status} />
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">
                            {CONDITION_LABELS[d.condition]}
                          </span>
                        </div>
                        <p className="text-[14px] text-foreground">{d.itemDescription}</p>
                        <p className="text-[12.5px] text-muted-foreground">
                          Metode: {DELIVERY_LABELS[d.deliveryMethod]} ·{" "}
                          {d.isAnonymous ? "Ditampilkan Anonim" : `Atas nama ${d.donorName ?? "Donatur"}`}
                        </p>
                        {d.adminNote ? (
                          <p className="text-[12.5px] font-medium text-primary">Catatan Admin: {d.adminNote}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
                      <span className="text-[12px] text-muted-foreground">{formatWibDateTime(d.createdAt)}</span>
                      {d.status === "PLEDGED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            cancelDon.mutate(d.id, {
                              onSuccess: () => toast.info({ title: "Donasi dibatalkan" }),
                            })
                          }
                          data-testid={`cancel-donation-${d.id}`}
                        >
                          Batalkan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
