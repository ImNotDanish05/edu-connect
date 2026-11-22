"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, ExternalLink, Plus, RotateCcw, Trash2, Users, Video, XCircle } from "lucide-react";
import { EDUCATION_LEVEL_LABELS, type MentorAvailabilitySlot, type MentorSession, type MentorSessionStatus } from "@open-lms/types";
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
  NativeSelect,
  Textarea,
  toast,
  cn,
} from "@open-lms/ui";
import { UnderlineTabs } from "@/components/common/underline-tabs";
import { StatusBadge } from "@/components/educonnect/common/status-badge";
import { Page, PageHeader } from "@/components/shell/layouts";
import {
  useActiveMentor,
  useAdminMentors,
  useCancelSession,
  useCompleteSession,
  useConfirmSession,
  useDeclineSession,
  useMySessions,
  useResetEduconnectDemo,
  useSwitchActiveMentor,
  useUpdateMentorAvailability,
} from "@/lib/educonnect/hooks";
import { WEEKDAY_NAMES_ID, formatMinuteOfDay, formatWibDateTime } from "@/lib/educonnect/mentor-slots";

type Tab = "student" | "incoming" | "schedule";

const STATUS_FILTERS: { value: MentorSessionStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua Status" },
  { value: "PENDING", label: "Menunggu" },
  { value: "CONFIRMED", label: "Dikonfirmasi" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELED", label: "Dibatalkan" },
  { value: "DECLINED", label: "Ditolak" },
];

export function MentoringPage() {
  const [tab, setTab] = useState<Tab>("student");
  const [statusFilter, setStatusFilter] = useState<MentorSessionStatus | "ALL">("ALL");

  const studentSessions = useMySessions("student", statusFilter);
  const incomingSessions = useMySessions("mentor", "ALL");
  const activeMentor = useActiveMentor();
  const allMentors = useAdminMentors();
  const switchMentor = useSwitchActiveMentor();
  const resetDemo = useResetEduconnectDemo();

  const pendingIncomingCount = (incomingSessions.data ?? []).filter((s) => s.status === "PENDING").length;

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "student", label: "Sesi Saya (Siswa)", count: studentSessions.data?.length },
    { value: "incoming", label: "Permintaan Masuk (Mode Mentor)", count: pendingIncomingCount },
    { value: "schedule", label: "Jadwal Mingguan Mentor" },
  ];

  return (
    <Page>
      <PageHeader
        title="Sesi Mentoring 1-on-1"
        lead="Pantau status permintaan bimbinganmu, bergabung ke link pertemuan, atau simulasi konfirmasi sebagai Mentor."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                resetDemo.mutate(undefined, {
                  onSuccess: () => toast.success({ title: "Data demo berhasil di-reset ke kondisi awal" }),
                })
              }
              data-testid="reset-demo-btn"
            >
              <RotateCcw className="size-4" />
              <span>Reset Data Demo</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/mentors">Cari Mentor Baru</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-col justify-between gap-3 rounded-card border border-primary/25 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center">
        <div className="text-[13px]">
          <span className="font-semibold text-foreground">Mode Simulasi Demo UAS:</span>{" "}
          <span className="text-muted-foreground">
            Gunakan tab <strong>Permintaan Masuk</strong> untuk mempraktikkan konfirmasi sesi & input link Google Meet sebagai Mentor.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="active-mentor-select" className="text-[12.5px] font-medium text-muted-foreground">
            Akun Mentor:
          </label>
          <NativeSelect
            id="active-mentor-select"
            value={activeMentor.data?.id ?? ""}
            onChange={(e) => switchMentor.mutate(e.target.value)}
            className="h-8 text-[12.5px]"
            data-testid="active-mentor-switcher"
          >
            {(allMentors.data ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <UnderlineTabs label="Tab Mentoring" tabs={tabs} value={tab} onChange={setTab} />

      <div className="pt-6">
        {tab === "student" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors",
                    statusFilter === f.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {!studentSessions.data?.length ? (
              <EmptyState
                icon={<Calendar />}
                title="Belum ada sesi mentoring"
                description="Pilih mentor di direktori dan ajukan jadwal sesi 1-on-1 pertamamu."
                action={
                  <Button asChild>
                    <Link href="/mentors">Jelajahi Direktori Mentor</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4" data-testid="student-sessions-list">
                {studentSessions.data.map((ses) => (
                  <StudentSessionCard key={ses.id} session={ses} />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "incoming" ? (
          <IncomingRequestsSection
            mentorName={activeMentor.data?.displayName ?? "Mentor"}
            sessions={incomingSessions.data ?? []}
          />
        ) : null}

        {tab === "schedule" && activeMentor.data ? (
          <AvailabilityEditor
            mentorId={activeMentor.data.id}
            mentorName={activeMentor.data.displayName}
            availability={activeMentor.data.availability}
          />
        ) : null}
      </div>
    </Page>
  );
}

function StudentSessionCard({ session: ses }: { session: MentorSession }) {
  const cancelMutation = useCancelSession();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const canCancel = ses.status === "PENDING" || ses.status === "CONFIRMED";

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    await cancelMutation.mutateAsync({ sessionId: ses.id, reason: reason.trim() || "Dibatalkan oleh siswa" });
    setCancelOpen(false);
    toast.success({ title: "Sesi mentoring dibatalkan" });
  };

  return (
    <article
      data-testid={`session-card-${ses.id}`}
      className="rounded-card border border-border bg-card p-5 shadow-card"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3.5">
          <Avatar name={ses.mentor.displayName} seed={ses.mentor.id} src={ses.mentor.avatarUrl} size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/mentors/${encodeURIComponent(ses.mentor.username)}`}
                className="font-display text-[17px] font-semibold hover:text-primary"
              >
                {ses.mentor.displayName}
              </Link>
              <StatusBadge status={ses.status} />
              {ses.compatibilityScore !== null ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                  {ses.compatibilityScore}% Cocok
                </span>
              ) : null}
            </div>
            {ses.mentor.institution ? (
              <p className="text-[12.5px] text-muted-foreground">{ses.mentor.institution}</p>
            ) : null}
            <p className="pt-1 font-medium text-foreground">{ses.topic}</p>
            {ses.message ? <p className="text-[13.5px] text-muted-foreground">“{ses.message}”</p> : null}
            {ses.cancelReason ? (
              <p className="text-[13px] text-danger">Catatan pembatalan/penolakan: {ses.cancelReason}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
          <p className="font-mono text-[13px] font-semibold text-foreground">{formatWibDateTime(ses.scheduledAt)}</p>
          <p className="text-[12px] text-muted-foreground">Durasi {ses.durationMinutes} menit</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ses.status === "CONFIRMED" && ses.meetingUrl ? (
              <Button asChild size="sm">
                <a
                  href={ses.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`join-meeting-${ses.id}`}
                >
                  <Video className="size-4" />
                  <span>Gabung Pertemuan</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelOpen(true)}
                data-testid={`cancel-session-${ses.id}`}
              >
                Batalkan
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent size="sm">
          <form onSubmit={(e) => void handleCancel(e)}>
            <DialogHeader>
              <DialogTitle>Batalkan Sesi Mentoring?</DialogTitle>
              <DialogDescription>Slot jadwal akan dilepas kembali untuk siswa lain.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field label="Alasan pembatalan" htmlFor={`cancel-reason-${ses.id}`} optional>
                <Textarea
                  id={`cancel-reason-${ses.id}`}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Ada jadwal kegiatan sekolah mendadak..."
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCancelOpen(false)}>
                Kembali
              </Button>
              <Button type="submit" variant="danger" loading={cancelMutation.isPending}>
                Ya, Batalkan Sesi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function IncomingRequestsSection({ mentorName, sessions }: { mentorName: string; sessions: MentorSession[] }) {
  const confirmMutation = useConfirmSession();
  const declineMutation = useDeclineSession();
  const completeMutation = useCompleteSession();

  const [confirmTarget, setConfirmTarget] = useState<MentorSession | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("https://meet.google.com/edu-connect-sesi");
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  const [declineTarget, setDeclineTarget] = useState<MentorSession | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTarget) return;
    setConfirmErr(null);
    try {
      await confirmMutation.mutateAsync({ sessionId: confirmTarget.id, meetingUrl });
      setConfirmTarget(null);
      toast.success({
        title: "Sesi Dikonfirmasi!",
        description: "Link pertemuan telah dikirimkan ke halaman Sesi Saya milik siswa.",
      });
    } catch (err) {
      setConfirmErr(err instanceof Error ? err.message : "Gagal mengonfirmasi sesi.");
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineTarget) return;
    await declineMutation.mutateAsync({ sessionId: declineTarget.id, reason: declineReason });
    setDeclineTarget(null);
    setDeclineReason("");
    toast.info({ title: "Permintaan sesi telah ditolak" });
  };

  if (!sessions.length) {
    return (
      <EmptyState
        icon={<Users />}
        title={`Belum ada permintaan sesi untuk ${mentorName}`}
        description="Coba ganti Akun Mentor di atas atau ajukan sesi baru dari halaman profil mentor."
      />
    );
  }

  return (
    <div className="space-y-4" data-testid="incoming-sessions-list">
      {sessions.map((ses) => (
        <article key={ses.id} className="rounded-card border border-border bg-card p-5 shadow-card">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[17px] font-semibold text-foreground">
                  Siswa: {ses.student.displayName}
                </span>
                {ses.student.educationLevel ? (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[12px] font-semibold text-primary">
                    {EDUCATION_LEVEL_LABELS[ses.student.educationLevel]}
                  </span>
                ) : null}
                <StatusBadge status={ses.status} />
              </div>
              <p className="font-medium text-foreground">Topik: {ses.topic}</p>
              {ses.message ? <p className="text-[13.5px] text-muted-foreground">Pesan siswa: “{ses.message}”</p> : null}
              {ses.meetingUrl ? (
                <p className="text-[13px] text-link">
                  Link Pertemuan:{" "}
                  <a href={ses.meetingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {ses.meetingUrl}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
              <p className="font-mono text-[13px] font-semibold">{formatWibDateTime(ses.scheduledAt)}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {ses.status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setConfirmTarget(ses);
                        setConfirmErr(null);
                      }}
                      data-testid={`mentor-confirm-${ses.id}`}
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Konfirmasi & Isi Link Meet</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeclineTarget(ses)}
                      data-testid={`mentor-decline-${ses.id}`}
                    >
                      <XCircle className="size-4" />
                      <span>Tolak</span>
                    </Button>
                  </>
                ) : null}
                {ses.status === "CONFIRMED" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      completeMutation.mutate(ses.id, {
                        onSuccess: () => toast.success({ title: "Sesi ditandai Selesai!" }),
                      })
                    }
                    data-testid={`mentor-complete-${ses.id}`}
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Tandai Selesai</span>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      ))}

      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent size="sm" data-testid="confirm-session-dialog">
          <form onSubmit={(e) => void handleConfirm(e)}>
            <DialogHeader>
              <DialogTitle>Konfirmasi Sesi Mentoring</DialogTitle>
              <DialogDescription>
                Masukkan link Google Meet, Zoom, atau WhatsApp Call untuk sesi bersama{" "}
                {confirmTarget?.student.displayName}.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <Field label="Link Pertemuan (Google Meet / Zoom / WA)" htmlFor="meeting-url-input">
                <Input
                  id="meeting-url-input"
                  type="url"
                  required
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  data-testid="meeting-url-input"
                />
              </Field>
              {confirmErr ? <p className="text-[13px] font-medium text-danger">{confirmErr}</p> : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConfirmTarget(null)}>
                Batal
              </Button>
              <Button type="submit" loading={confirmMutation.isPending} data-testid="confirm-session-submit">
                Konfirmasi Sesi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!declineTarget} onOpenChange={(o) => !o && setDeclineTarget(null)}>
        <DialogContent size="sm">
          <form onSubmit={(e) => void handleDecline(e)}>
            <DialogHeader>
              <DialogTitle>Tolak Permintaan Sesi</DialogTitle>
              <DialogDescription>Berikan alasan singkat agar siswa dapat memilih jadwal atau mentor lain.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field label="Alasan Penolakan" htmlFor="decline-reason-input">
                <Textarea
                  id="decline-reason-input"
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Contoh: Maaf, ada jadwal ujian kampus di jam tersebut..."
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDeclineTarget(null)}>
                Batal
              </Button>
              <Button type="submit" variant="danger" loading={declineMutation.isPending}>
                Tolak Permintaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AvailabilityEditor({
  mentorId,
  mentorName,
  availability,
}: {
  mentorId: string;
  mentorName: string;
  availability: MentorAvailabilitySlot[];
}) {
  const updateAvail = useUpdateMentorAvailability();
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>(availability);
  const [weekday, setWeekday] = useState<number>(1);
  const [startHour, setStartHour] = useState<number>(16);
  const [endHour, setEndHour] = useState<number>(19);

  const handleAdd = () => {
    if (endHour <= startHour) {
      toast.error({ title: "Jam selesai harus lebih besar dari jam mulai" });
      return;
    }
    const next = [...slots, { weekday, startMinute: startHour * 60, endMinute: endHour * 60 }];
    setSlots(next);
    updateAvail.mutate(
      { mentorId, slots: next },
      { onSuccess: () => toast.success({ title: "Slot jadwal mingguan ditambahkan" }) },
    );
  };

  const handleRemove = (index: number) => {
    const next = slots.filter((_, i) => i !== index);
    setSlots(next);
    updateAvail.mutate(
      { mentorId, slots: next },
      { onSuccess: () => toast.info({ title: "Slot jadwal dihapus" }) },
    );
  };

  return (
    <div className="max-w-2xl space-y-6 rounded-card border border-border bg-card p-6 shadow-card">
      <div>
        <h2 className="font-display text-[19px] font-semibold">Jadwal Mingguan - {mentorName}</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Slot ketersediaan dalam zona waktu WIB (UTC+7). Perubahan langsung memperbarui kalender 14 hari di halaman profil mentor.
        </p>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {slots.length === 0 ? (
          <li className="p-4 text-[13.5px] text-muted-foreground">Belum ada jadwal mingguan.</li>
        ) : (
          slots.map((sl, i) => (
            <li key={`${sl.weekday}-${sl.startMinute}-${i}`} className="flex items-center justify-between px-4 py-3 text-[14px]">
              <div>
                <span className="font-semibold text-foreground">{WEEKDAY_NAMES_ID[sl.weekday]}</span>
                <span className="ml-3 font-mono text-muted-foreground">
                  {formatMinuteOfDay(sl.startMinute)} – {formatMinuteOfDay(sl.endMinute)} WIB
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRemove(i)}>
                <Trash2 className="size-4 text-danger" />
              </Button>
            </li>
          ))
        )}
      </ul>

      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-4 sm:items-end">
        <Field label="Hari" htmlFor="avail-weekday">
          <NativeSelect id="avail-weekday" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAY_NAMES_ID.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Mulai (WIB)" htmlFor="avail-start">
          <NativeSelect id="avail-start" value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
            {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Selesai (WIB)" htmlFor="avail-end">
          <NativeSelect id="avail-end" value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
            {Array.from({ length: 15 }, (_, i) => i + 8).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button type="button" onClick={handleAdd}>
          <Plus className="size-4" />
          <span>Tambah</span>
        </Button>
      </div>
    </div>
  );
}
