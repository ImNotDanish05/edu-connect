"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gift, Heart, History, Package, Sparkles, Upload, Users } from "lucide-react";
import {
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_LABELS,
  type DonationCondition,
  type DonationDelivery,
  type DonationItemType,
  type EducationLevel,
  type KitboxPackage,
} from "@open-lms/types";
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  NativeSelect,
  Skeleton,
  Textarea,
  toast,
  cn,
} from "@open-lms/ui";
import { LevelChips } from "@/components/educonnect/common/level-chips";
import { Page, PageHeader } from "@/components/shell/layouts";
import {
  useKitboxImpact,
  useKitboxPackages,
  useMyKitbox,
  useStudentProfile,
  useSubmitKitboxDonation,
  useSubmitKitboxRequest,
} from "@/lib/educonnect/hooks";

const ITEM_TYPE_LABELS: Record<DonationItemType, string> = {
  BOOK: "Buku Pelajaran / Modul",
  STATIONERY: "Alat Tulis & Perlengkapan",
  OTHER: "Perlengkapan Belajar Lainnya",
};

export function KitboxPage() {
  const router = useRouter();
  const packages = useKitboxPackages();
  const impact = useKitboxImpact();
  const myKitbox = useMyKitbox();
  const profile = useStudentProfile();

  const [claimPkg, setClaimPkg] = useState<KitboxPackage | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);

  const myActivityCount = (myKitbox.data?.requests.length ?? 0) + (myKitbox.data?.donations.length ?? 0);

  return (
    <Page>
      <PageHeader
        title="Educational KitBox - Berbagi & Klaim Perlengkapan Belajar"
        lead="Inisiatif dampak sosial EduConnect (SDG 1 & SDG 4): menyalurkan donasi buku dan perlengkapan belajar gratis kepada pelajar yang membutuhkan."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/kitbox/mine" data-testid="go-to-my-kitbox">
                <History className="size-4" />
                <span>Riwayat KitBox Saya</span>
                {myActivityCount > 0 ? (
                  <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[12px] font-semibold text-primary">
                    {myActivityCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button onClick={() => setDonationOpen(true)} data-testid="open-donation-dialog">
              <Heart className="size-4" />
              <span>Donasikan Barang</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-10">
        {/* Feature 1.8: Impact Tracker */}
        <section
          aria-labelledby="impact-title"
          data-testid="kitbox-impact-tracker"
          className="rounded-card border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-0.5 text-[12px] font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                <span>Impact Tracker Publik · SDG 1 & SDG 4</span>
              </span>
              <h2 id="impact-title" className="mt-2 font-display text-[22px] font-semibold tracking-[-0.015em]">
                Jejak Dampak Gerakan KitBox EduConnect
              </h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDonationOpen(true)}>
              <Gift className="size-4" />
              <span>Ikut Berdonasi Sekarang</span>
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[12.5px] font-medium text-muted-foreground">Barang Didonasikan</p>
              <p className="mt-1 font-display text-[28px] font-semibold tabular-nums text-foreground" data-testid="impact-items">
                {impact.data?.itemsDonated ?? 0}
              </p>
              <p className="text-[11.5px] text-muted-foreground">Buku, modul & alat tulis</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[12.5px] font-medium text-muted-foreground">Donatur Berpartisipasi</p>
              <p className="mt-1 font-display text-[28px] font-semibold tabular-nums text-foreground" data-testid="impact-donors">
                {impact.data?.donors ?? 0}
              </p>
              <p className="text-[11.5px] text-muted-foreground">Mahasiswa, alumni & umum</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[12.5px] font-medium text-muted-foreground">Paket KitBox Tersalurkan</p>
              <p className="mt-1 font-display text-[28px] font-semibold tabular-nums text-emerald-600" data-testid="impact-kits">
                {impact.data?.kitsDelivered ?? 0}
              </p>
              <p className="text-[11.5px] text-muted-foreground">Terkirim ke seluruh Indonesia</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[12.5px] font-medium text-muted-foreground">Siswa Terbantu</p>
              <p className="mt-1 font-display text-[28px] font-semibold tabular-nums text-primary" data-testid="impact-students">
                {impact.data?.studentsHelped ?? 0}
              </p>
              <p className="text-[11.5px] text-muted-foreground">Jenjang SD, SMP & SMA</p>
            </div>
          </div>

          {impact.data?.recentDonors.length ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Donatur Terbaru
              </p>
              <div className="flex flex-wrap gap-2">
                {impact.data.recentDonors.map((d, idx) => (
                  <span
                    key={`${d.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12.5px]"
                  >
                    <Users className="size-3.5 text-primary" aria-hidden />
                    <span className="font-semibold text-foreground">{d.name}</span>
                    <span className="text-muted-foreground">
                      · {d.quantity ? `${d.quantity} ` : ""}
                      {ITEM_TYPE_LABELS[d.itemType]}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Feature 1.7: KitBox Package Catalog */}
        <section aria-labelledby="catalog-title">
          <div className="mb-5">
            <h2 id="catalog-title" className="font-display text-[22px] font-semibold tracking-[-0.015em]">
              Katalog Paket KitBox Tersedia
            </h2>
            <p className="mt-1 text-[14.5px] text-muted-foreground">
              Pilih paket sesuai jenjang pendidikanmu dan ajukan klaim secara gratis (maksimal 1 pengajuan aktif per paket).
            </p>
          </div>

          {packages.isPending ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-80 rounded-card" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="kitbox-package-grid">
              {(packages.data ?? []).map((pkg) => {
                const outOfStock = pkg.stock <= 0;
                return (
                  <article
                    key={pkg.id}
                    data-testid={`kitbox-pkg-${pkg.slug}`}
                    className="flex flex-col justify-between rounded-card border border-border bg-card p-6 shadow-card"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Package className="size-6" aria-hidden />
                        </div>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[12px] font-semibold tabular-nums",
                            outOfStock
                              ? "border-danger/30 bg-danger/10 text-danger"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          )}
                        >
                          {outOfStock ? "Stok Habis" : `Stok: ${pkg.stock} paket`}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display text-[19px] font-semibold">{pkg.name}</h3>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{pkg.summary}</p>
                      </div>

                      <div>
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-subtle-foreground">
                          Isi Paket KitBox:
                        </p>
                        <ul className="space-y-1.5 text-[13.5px] text-foreground">
                          {pkg.contents.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-border pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-muted-foreground">Jenjang:</span>
                        <LevelChips levels={pkg.educationLevels} />
                      </div>
                      <Button
                        className="w-full"
                        disabled={outOfStock}
                        onClick={() => setClaimPkg(pkg)}
                        data-testid={`claim-pkg-${pkg.slug}`}
                      >
                        <Gift className="size-4" />
                        <span>{outOfStock ? "Stok Sedang Habis" : "Ajukan Klaim Gratis"}</span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ClaimRequestDialog
        pkg={claimPkg}
        defaultLevel={profile.data?.educationLevel ?? "SMA"}
        onClose={() => setClaimPkg(null)}
        onSuccess={() => {
          setClaimPkg(null);
          router.push("/kitbox/mine");
        }}
      />

      <DonationDialog
        open={donationOpen}
        onOpenChange={setDonationOpen}
        onSuccess={() => {
          setDonationOpen(false);
          router.push("/kitbox/mine");
        }}
      />
    </Page>
  );
}

function ClaimRequestDialog({
  pkg,
  defaultLevel,
  onClose,
  onSuccess,
}: {
  pkg: KitboxPackage | null;
  defaultLevel: EducationLevel;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const submitClaim = useSubmitKitboxRequest();
  const [recipientName, setRecipientName] = useState("Nadia Putri");
  const [phone, setPhone] = useState("081234567890");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(defaultLevel);
  const [institution, setInstitution] = useState("SMAN 3 Semarang");
  const [city, setCity] = useState("Semarang");
  const [shippingAddress, setShippingAddress] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;
    setErr(null);
    if (!/^\+?[0-9]{8,15}$/.test(phone.trim())) {
      setErr("Nomor HP/WhatsApp harus berupa 8–15 digit angka.");
      return;
    }
    if (shippingAddress.trim().length < 10) {
      setErr("Alamat pengiriman minimal 10 karakter.");
      return;
    }
    if (reason.trim().length < 20) {
      setErr("Alasan pengajuan minimal 20 karakter.");
      return;
    }
    try {
      await submitClaim.mutateAsync({
        packageId: pkg.id,
        recipientName,
        phone,
        educationLevel,
        institution,
        city,
        shippingAddress,
        reason,
      });
      toast.success({
        title: "Pengajuan KitBox berhasil dikirim!",
        description: "Tim EduConnect akan memverifikasi pengajuanmu.",
      });
      onSuccess();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Gagal mengirim pengajuan.");
    }
  };

  return (
    <Dialog open={!!pkg} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md" data-testid="claim-kitbox-dialog">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Ajukan Klaim Gratis - {pkg?.name}</DialogTitle>
            <DialogDescription>
              Isi data pengiriman dan alasan kebutuhan belajarmu. Data nomor HP & alamat bersifat rahasia (hanya dilihat oleh tim verifikasi).
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap Penerima" htmlFor="claim-name">
                <Input
                  id="claim-name"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  data-testid="claim-recipient-name"
                />
              </Field>
              <Field label="Nomor WhatsApp / HP" htmlFor="claim-phone">
                <Input
                  id="claim-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  data-testid="claim-phone"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Jenjang" htmlFor="claim-level">
                <NativeSelect
                  id="claim-level"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                >
                  {EDUCATION_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {EDUCATION_LEVEL_LABELS[l]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Sekolah / Kampus" htmlFor="claim-inst">
                <Input
                  id="claim-inst"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: SMAN 3 Semarang"
                />
              </Field>
              <Field label="Kota / Kabupaten" htmlFor="claim-city">
                <Input
                  id="claim-city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Semarang"
                />
              </Field>
            </div>

            <Field label="Alamat Pengiriman Lengkap" htmlFor="claim-address">
              <Textarea
                id="claim-address"
                rows={2}
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kode pos..."
                data-testid="claim-address"
              />
            </Field>

            <Field
              label="Alasan Pengajuan & Target Belajar"
              htmlFor="claim-reason"
              hint="Minimal 20 karakter. Ceritakan mengapa paket ini akan membantu proses belajarmu."
            >
              <Textarea
                id="claim-reason"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Saya sedang mempersiapkan ujian SNBT dan olimpiade ekonomi namun membutuhkan buku modul latihan..."
                data-testid="claim-reason"
              />
            </Field>

            {err ? (
              <p role="alert" className="text-[13px] font-medium text-danger">
                {err}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" loading={submitClaim.isPending} data-testid="claim-submit-btn">
              Kirim Pengajuan Klaim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DonationDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
  const submitDonation = useSubmitKitboxDonation();
  const [donorName, setDonorName] = useState("Budi Santoso");
  const [donorContact, setDonorContact] = useState("081298765432");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [itemType, setItemType] = useState<DonationItemType>("BOOK");
  const [condition, setCondition] = useState<DonationCondition>("LIKE_NEW");
  const [deliveryMethod, setDeliveryMethod] = useState<DonationDelivery>("DROP_POINT");
  const [quantity, setQuantity] = useState("3");
  const [itemDescription, setItemDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
      setErr("Jumlah barang harus antara 1 sampai 500.");
      return;
    }
    if (itemDescription.trim().length < 5) {
      setErr("Deskripsi barang minimal 5 karakter.");
      return;
    }
    try {
      await submitDonation.mutateAsync({
        donorName,
        donorContact,
        isAnonymous,
        itemType,
        itemDescription,
        quantity: qty,
        condition,
        deliveryMethod,
        photoUrl: photoPreview,
      });
      setItemDescription("");
      setPhotoPreview(null);
      toast.success({
        title: "Terima kasih atas donasimu!",
        description: "Donasi tercatat dan Impact Tracker telah diperbarui.",
      });
      onSuccess();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Gagal menyimpan donasi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" data-testid="donation-kitbox-dialog">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Donasikan Buku & Perlengkapan Belajar</DialogTitle>
            <DialogDescription>
              Barang layak pakai dari kakak tingkat dan donatur akan dikemas menjadi paket KitBox gratis untuk pelajar Indonesia.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Donatur" htmlFor="don-name">
                <Input
                  id="don-name"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  data-testid="donation-donor-name"
                />
              </Field>
              <Field label="Kontak (WhatsApp / Email)" htmlFor="don-contact">
                <Input
                  id="don-contact"
                  required
                  value={donorContact}
                  onChange={(e) => setDonorContact(e.target.value)}
                  data-testid="donation-donor-contact"
                />
              </Field>
            </div>

            <label className="flex items-center gap-2.5 text-[13.5px] text-foreground cursor-pointer">
              <Checkbox checked={isAnonymous} onCheckedChange={(c) => setIsAnonymous(!!c)} />
              <span>Tampilkan sebagai &ldquo;Sahabat EduConnect (Anonim)&rdquo; di Impact Tracker publik</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Kategori Barang" htmlFor="don-type">
                <NativeSelect
                  id="don-type"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as DonationItemType)}
                >
                  <option value="BOOK">Buku / Modul</option>
                  <option value="STATIONERY">Alat Tulis</option>
                  <option value="OTHER">Lainnya</option>
                </NativeSelect>
              </Field>
              <Field label="Jumlah (Pcs/Buku)" htmlFor="don-qty">
                <Input
                  id="don-qty"
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  data-testid="donation-quantity"
                />
              </Field>
              <Field label="Kondisi Barang" htmlFor="don-cond">
                <NativeSelect
                  id="don-cond"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as DonationCondition)}
                >
                  <option value="NEW">Baru (100%)</option>
                  <option value="LIKE_NEW">Seperti Baru (90%+)</option>
                  <option value="GOOD">Layak Pakai</option>
                </NativeSelect>
              </Field>
            </div>

            <Field label="Metode Penyerahan" htmlFor="don-delivery">
              <NativeSelect
                id="don-delivery"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as DonationDelivery)}
              >
                <option value="DROP_POINT">Antar ke Drop Point Kampus (FEB UNDIP Tembalang)</option>
                <option value="COURIER">Kirim via Ekspedisi / Kurir</option>
                <option value="PICKUP">Jemput oleh Relawan KitBox (Area Semarang)</option>
              </NativeSelect>
            </Field>

            <Field label="Deskripsi Barang yang Didonasikan" htmlFor="don-desc">
              <Textarea
                id="don-desc"
                rows={2}
                required
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Contoh: 2 Buku Wangsit SNBT 2026 + 1 Kalkulator Scientific Casio..."
                data-testid="donation-description"
              />
            </Field>

            <Field label="Foto Barang (Opsional)" htmlFor="don-photo">
              <div className="flex items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-ground-2 px-3.5 py-2 text-[13px] font-medium hover:bg-muted">
                  <Upload className="size-4 text-primary" aria-hidden />
                  <span>Pilih Foto</span>
                  <input
                    id="don-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handlePhotoChange}
                  />
                </label>
                {photoPreview ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview donasi" className="size-12 rounded-lg object-cover border border-border" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPhotoPreview(null)}>
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <span className="text-[12px] text-muted-foreground">JPG, PNG, atau WebP</span>
                )}
              </div>
            </Field>

            {err ? (
              <p role="alert" className="text-[13px] font-medium text-danger">
                {err}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitDonation.isPending} data-testid="donation-submit-btn">
              Kirim Formulir Donasi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
