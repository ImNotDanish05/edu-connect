"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Calendar, CheckCircle2, Clock, GraduationCap, Sparkles } from "lucide-react";
import { INTEREST_TAG_LABELS, type MentorSlot } from "@open-lms/types";
import {
  Avatar,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Skeleton,
  Textarea,
  toast,
  cn,
} from "@open-lms/ui";
import { CompatibilityMeter } from "@/components/educonnect/common/compatibility-meter";
import { LevelChips } from "@/components/educonnect/common/level-chips";
import { VerifiedBadge } from "@/components/educonnect/common/verified-badge";
import { Page } from "@/components/shell/layouts";
import { useMentorDetail, useMentorSlots, useRequestSession } from "@/lib/educonnect/hooks";
import {
  WEEKDAY_NAMES_ID,
  formatMinuteOfDay,
  formatWibDateHeader,
  formatWibDateTime,
  formatWibTime,
} from "@/lib/educonnect/mentor-slots";

const formatIdr = (amount: number) =>
  amount <= 0
    ? "Gratis (Relawan)"
    : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function MentorProfilePage({ username }: { username: string }) {
  const router = useRouter();
  const mentorQuery = useMentorDetail(username);
  const slotsQuery = useMentorSlots(username);
  const requestMutation = useRequestSession();

  const [selectedSlot, setSelectedSlot] = useState<MentorSlot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, MentorSlot[]>();
    for (const sl of slotsQuery.data ?? []) {
      const dateLabel = formatWibDateHeader(sl.startsAt);
      const list = groups.get(dateLabel) ?? [];
      list.push(sl);
      groups.set(dateLabel, list);
    }
    return Array.from(groups.entries());
  }, [slotsQuery.data]);

  if (mentorQuery.isPending) {
    return (
      <Page>
        <Skeleton className="h-64 rounded-card" />
      </Page>
    );
  }

  const m = mentorQuery.data;
  if (!m) {
    return (
      <Page>
        <EmptyState
          title="Mentor tidak ditemukan"
          description="Profil mentor yang kamu cari tidak tersedia."
          action={
            <Button asChild>
              <Link href="/mentors">Kembali ke Direktori Mentor</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  const handleOpenBooking = () => {
    if (!selectedSlot) {
      toast.info({ title: "Pilih salah satu slot jadwal terlebih dahulu" });
      return;
    }
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (topic.trim().length < 3) {
      setFormError("Topik bahasan minimal 3 karakter.");
      return;
    }
    setFormError(null);
    try {
      await requestMutation.mutateAsync({
        mentorId: m.id,
        scheduledAt: selectedSlot.startsAt,
        topic: topic.trim(),
        message: message.trim() || null,
      });
      setDialogOpen(false);
      setTopic("");
      setMessage("");
      toast.success({
        title: "Permintaan sesi terkirim!",
        description: "Status sesi: Menunggu Konfirmasi mentor.",
      });
      router.push("/mentoring");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mengirim permintaan sesi.");
    }
  };

  return (
    <Page>
      <div className="mb-5">
        <Link
          href="/mentors"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span>Kembali ke Direktori Mentor</span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar name={m.displayName} seed={m.id} src={m.avatarUrl} size="xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">{m.displayName}</h1>
                  {m.isVerified ? <VerifiedBadge /> : null}
                </div>
                <p className="text-[15px] text-muted-foreground">{m.headline}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[13.5px] text-muted-foreground">
                  {m.institution ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                      <Building2 className="size-4" aria-hidden />
                      {m.institution}
                    </span>
                  ) : null}
                  {m.major ? (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="size-4" aria-hidden />
                      {m.major}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                    {m.sessionsCompleted} sesi selesai
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <h2 className="mb-2 text-[14px] font-semibold text-foreground">Analisis Kecocokan dengan Profilmu</h2>
              <CompatibilityMeter compatibility={m.compatibility} showReasons />
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-6 shadow-card space-y-5">
            <div>
              <h2 className="font-display text-[18px] font-semibold">Tentang Mentor</h2>
              <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-muted-foreground">
                {m.bio || m.headline}
              </p>
            </div>

            <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Spesialisasi Bimbingan
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {m.specialties.map((sp) => (
                    <span
                      key={sp}
                      className="rounded-md border border-border bg-ground-2 px-2.5 py-1 text-[12.5px] font-medium text-foreground"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Jenjang yang Dibimbing
                </h3>
                <LevelChips levels={m.educationLevels} />
                <h3 className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Topik Minat
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {m.interests.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-[12px] text-muted-foreground">
                      {INTEREST_TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Jadwal Rutin Mingguan (WIB)
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2 text-[13.5px]">
                {m.availability.map((av, idx) => (
                  <li
                    key={`${av.weekday}-${av.startMinute}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-ground-2 px-3 py-2"
                  >
                    <span className="font-medium text-foreground">{WEEKDAY_NAMES_ID[av.weekday]}</span>
                    <span className="font-mono text-muted-foreground">
                      {formatMinuteOfDay(av.startMinute)} – {formatMinuteOfDay(av.endMinute)} WIB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="sticky top-20 rounded-card border border-border bg-card p-5 shadow-card space-y-5">
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wider text-subtle-foreground">Biaya Sesi 1-on-1</p>
              <p className="mt-0.5 font-display text-[22px] font-semibold text-foreground">{formatIdr(m.pricePerSession)}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              {m.sessionMinutes} menit
            </span>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-[16px] font-semibold">
                <Calendar className="size-4 text-primary" aria-hidden />
                <span>Pilih Slot Tersedia (14 Hari)</span>
              </h2>
              <span className="text-[11.5px] text-muted-foreground">Zona WIB</span>
            </div>

            {!groupedSlots.length ? (
              <p className="rounded-lg border border-border bg-ground-2 p-4 text-[13px] text-muted-foreground">
                Belum ada slot jadwal yang tersedia dalam 14 hari ke depan.
              </p>
            ) : (
              <div className="max-h-[340px] space-y-4 overflow-y-auto pr-1" data-testid="availability-picker">
                {groupedSlots.map(([dateLabel, daySlots]) => (
                  <div key={dateLabel}>
                    <p className="mb-1.5 text-[12.5px] font-semibold text-foreground">{dateLabel}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {daySlots.map((sl) => {
                        const isSelected = selectedSlot?.startsAt === sl.startsAt;
                        return (
                          <button
                            key={sl.startsAt}
                            type="button"
                            onClick={() => setSelectedSlot(sl)}
                            aria-pressed={isSelected}
                            data-testid={`slot-btn-${sl.startsAt}`}
                            className={cn(
                              "rounded-lg border px-2.5 py-2 text-center font-mono text-[12.5px] font-medium transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border bg-ground-2 text-foreground hover:border-primary/50 hover:bg-muted",
                            )}
                          >
                            {formatWibTime(sl.startsAt)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSlot ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[12.5px]">
              <span className="font-semibold text-foreground">Slot dipilih:</span>{" "}
              <span className="text-primary font-medium">{formatWibDateTime(selectedSlot.startsAt)}</span>
            </div>
          ) : null}

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedSlot}
            onClick={handleOpenBooking}
            data-testid="open-booking-dialog"
          >
            <Sparkles className="size-4" />
            <span>Ajukan Sesi Mentoring</span>
          </Button>
          <p className="text-center text-[11.5px] text-muted-foreground">
            Mentor akan mengonfirmasi jadwal dan mengirimkan link Google Meet / Zoom / WhatsApp.
          </p>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="sm" data-testid="booking-dialog">
          <form onSubmit={(e) => void handleSubmitBooking(e)}>
            <DialogHeader>
              <DialogTitle>Ajukan Sesi 1-on-1 bersama {m.displayName}</DialogTitle>
              <DialogDescription>
                Jadwal: {selectedSlot ? formatWibDateTime(selectedSlot.startsAt) : "-"} ({m.sessionMinutes} menit)
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <Field
                label="Topik Bahasan"
                htmlFor="booking-topic"
                hint="Contoh: Bedah Soal Akuntansi Dasar / Review Esai Beasiswa"
              >
                <Input
                  id="booking-topic"
                  required
                  minLength={3}
                  maxLength={120}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Apa yang ingin kamu pelajari di sesi ini?"
                  data-testid="booking-topic-input"
                />
              </Field>
              <Field label="Pesan atau Pertanyaan Awal" htmlFor="booking-message" optional>
                <Textarea
                  id="booking-message"
                  rows={3}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ceritakan singkat kesulitanmu atau materi yang ingin dibahas..."
                  data-testid="booking-message-input"
                />
              </Field>
              {formError ? (
                <p role="alert" className="text-[13px] font-medium text-danger">
                  {formError}
                </p>
              ) : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" loading={requestMutation.isPending} data-testid="confirm-booking-submit">
                Kirim Permintaan Sesi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
