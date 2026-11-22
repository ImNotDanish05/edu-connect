"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import {
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
  type InterestTag,
  type MentorSession,
} from "@open-lms/types";
import { Avatar, Button, Checkbox, Field, Input, Switch, Textarea, toast } from "@open-lms/ui";
import { DataTable, type Column } from "@/components/admin/shell/data-table";
import { DetailSection, DetailSheet, FactList } from "@/components/admin/shell/detail-sheet";
import { FilterBar } from "@/components/admin/shell/filter-bar";
import { InterestPicker } from "@/components/educonnect/common/interest-picker";
import { LevelChips } from "@/components/educonnect/common/level-chips";
import { StatusBadge } from "@/components/educonnect/common/status-badge";
import { VerifiedBadge } from "@/components/educonnect/common/verified-badge";
import { useAdminMentors, useAdminUpsertMentor, useMySessions } from "@/lib/educonnect/hooks";
import { formatWibDateTime } from "@/lib/educonnect/mentor-slots";
import type { StoredMentor } from "@/lib/educonnect/mock-store";

type Tab = "mentors" | "sessions";

export function AdminMentorsPage() {
  const [tab, setTab] = useState<Tab>("mentors");
  const [q, setQ] = useState("");
  const mentorsQuery = useAdminMentors();
  const sessionsQuery = useMySessions("student", "ALL");
  const upsertMentor = useAdminUpsertMentor();

  const [selected, setSelected] = useState<StoredMentor | null>(null);
  const [creating, setCreating] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [institution, setInstitution] = useState("");
  const [major, setMajor] = useState("");
  const [bio, setBio] = useState("");
  const [specialtiesText, setSpecialtiesText] = useState("");
  const [interests, setInterests] = useState<InterestTag[]>(["matematika", "persiapan-snbt"]);
  const [levels, setLevels] = useState<EducationLevel[]>(["SMA"]);
  const [price, setPrice] = useState("25000");
  const [minutes, setMinutes] = useState("60");
  const [isVerified, setIsVerified] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const openEditor = (m: StoredMentor | null) => {
    if (m) {
      setSelected(m);
      setCreating(false);
      setEmail(m.email);
      setDisplayName(m.displayName);
      setHeadline(m.headline);
      setInstitution(m.institution ?? "");
      setMajor(m.major ?? "");
      setBio(m.bio ?? "");
      setSpecialtiesText(m.specialties.join(", "));
      setInterests(m.interests);
      setLevels(m.educationLevels);
      setPrice(String(m.pricePerSession));
      setMinutes(String(m.sessionMinutes));
      setIsVerified(m.isVerified);
      setIsActive(m.isActive);
    } else {
      setSelected(null);
      setCreating(true);
      setEmail("mentor.baru@students.undip.ac.id");
      setDisplayName("");
      setHeadline("");
      setInstitution("FEB Universitas Diponegoro (UNDIP)");
      setMajor("S1 Akuntansi");
      setBio("");
      setSpecialtiesText("Akuntansi SMA, Persiapan SNBT");
      setInterests(["akuntansi", "persiapan-snbt"]);
      setLevels(["SMA"]);
      setPrice("25000");
      setMinutes("60");
      setIsVerified(true);
      setIsActive(true);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim() || !headline.trim()) {
      toast.error({ title: "Nama dan headline mentor wajib diisi" });
      return;
    }
    await upsertMentor.mutateAsync({
      id: selected?.id,
      email,
      displayName,
      headline,
      institution,
      major,
      bio,
      specialties: specialtiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      interests,
      educationLevels: levels,
      pricePerSession: Number(price) || 0,
      sessionMinutes: Number(minutes) || 60,
      isVerified,
      isActive,
    });
    toast.success({ title: selected ? "Profil mentor diperbarui" : "Mentor baru ditambahkan" });
    setSelected(null);
    setCreating(false);
  };

  const filteredMentors = (mentorsQuery.data ?? []).filter((m) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return `${m.displayName} ${m.email} ${m.institution ?? ""} ${m.specialties.join(" ")}`.toLowerCase().includes(term);
  });

  const mentorColumns: Column<StoredMentor>[] = [
    {
      key: "name",
      header: "Mentor",
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.displayName} seed={m.id} src={m.avatarUrl} size="sm" />
          <div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span>{m.displayName}</span>
              {m.isVerified ? <VerifiedBadge compact /> : null}
            </div>
            <p className="text-[12px] text-muted-foreground">{m.institution || m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "levels",
      header: "Jenjang",
      cell: (m) => <LevelChips levels={m.educationLevels} />,
    },
    {
      key: "specialties",
      header: "Spesialisasi",
      hideBelow: "md",
      cell: (m) => <span className="text-[13px] text-muted-foreground">{m.specialties.slice(0, 3).join(", ")}</span>,
    },
    {
      key: "sessions",
      header: "Sesi Selesai",
      align: "right",
      sortValue: (m) => m.sessionsCompleted,
      cell: (m) => m.sessionsCompleted,
    },
    {
      key: "status",
      header: "Status",
      cell: (m) => (
        <span className={m.isActive ? "text-[12.5px] font-semibold text-emerald-600" : "text-[12.5px] text-muted-foreground"}>
          {m.isActive ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
  ];

  const sessionColumns: Column<MentorSession>[] = [
    {
      key: "student",
      header: "Siswa",
      cell: (s) => <span className="font-medium text-foreground">{s.student.displayName}</span>,
    },
    {
      key: "mentor",
      header: "Mentor",
      cell: (s) => s.mentor.displayName,
    },
    {
      key: "topic",
      header: "Topik",
      hideBelow: "md",
      cell: (s) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{s.topic}</span>,
    },
    {
      key: "scheduledAt",
      header: "Jadwal (WIB)",
      cell: (s) => <span className="font-mono text-[12.5px]">{formatWibDateTime(s.scheduledAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">Manajemen Mentor 1-on-1</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Verifikasi kakak tingkat & mahasiswa berprestasi, atur spesialisasi jenjang, dan pantau sesi bimbingan.
          </p>
        </div>
        <Button onClick={() => openEditor(null)} data-testid="admin-add-mentor">
          <Plus className="size-4" />
          <span>Tambah Mentor</span>
        </Button>
      </div>

      <FilterBar
        tabs={[
          { value: "mentors", label: `Daftar Mentor (${filteredMentors.length})` },
          { value: "sessions", label: `Pengawasan Sesi (${sessionsQuery.data?.length ?? 0})` },
        ]}
        tab={tab}
        onTabChange={setTab}
        search={tab === "mentors" ? q : undefined}
        onSearchChange={tab === "mentors" ? setQ : undefined}
        searchPlaceholder="Cari mentor atau kampus..."
      />

      {tab === "mentors" ? (
        <DataTable
          rows={filteredMentors}
          columns={mentorColumns}
          rowKey={(m) => m.id}
          caption="Daftar mentor EduConnect"
          onRowClick={(m) => openEditor(m)}
          selectedKey={selected?.id ?? null}
          empty={{ icon: <Users />, title: "Belum ada mentor terdaftar" }}
          testId="admin-mentors-table"
        />
      ) : (
        <DataTable
          rows={sessionsQuery.data ?? []}
          columns={sessionColumns}
          rowKey={(s) => s.id}
          caption="Daftar sesi mentoring"
          empty={{ icon: <Users />, title: "Belum ada sesi mentoring" }}
          testId="admin-sessions-table"
        />
      )}

      <DetailSheet
        open={!!selected || creating}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setCreating(false);
          }
        }}
        title={creating ? "Tambah Profil Mentor Baru" : selected?.displayName}
        description={creating ? "Buat profil mentor dari akun mahasiswa/alumni" : selected?.institution ?? selected?.email}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSelected(null);
                setCreating(false);
              }}
            >
              Batal
            </Button>
            <Button onClick={() => void handleSave()} loading={upsertMentor.isPending} data-testid="admin-save-mentor">
              Simpan Mentor
            </Button>
          </div>
        }
      >
        <DetailSection title="Status Verifikasi & Aktivasi">
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-[13.5px]">
              <span>Badge Terverifikasi (Lolos seleksi akademik & CV)</span>
              <Switch checked={isVerified} onCheckedChange={setIsVerified} />
            </label>
            <label className="flex items-center justify-between gap-3 text-[13.5px]">
              <span>Tampilkan di Direktori Publik (Aktif menerima sesi)</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
          </div>
        </DetailSection>

        <DetailSection title="Identitas & Universitas">
          <div className="space-y-3">
            <Field label="Email Akun" htmlFor="adm-m-email">
              <Input id="adm-m-email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Nama Tampilan" htmlFor="adm-m-name">
              <Input id="adm-m-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Headline Singkat" htmlFor="adm-m-headline">
              <Input id="adm-m-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institusi / Kampus" htmlFor="adm-m-inst">
                <Input id="adm-m-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </Field>
              <Field label="Program Studi / Jurusan" htmlFor="adm-m-major">
                <Input id="adm-m-major" value={major} onChange={(e) => setMajor(e.target.value)} />
              </Field>
            </div>
            <Field label="Bio Mentor" htmlFor="adm-m-bio">
              <Textarea id="adm-m-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
          </div>
        </DetailSection>

        <DetailSection title="Jenjang, Spesialisasi & Tarif Sesi">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[13px] font-medium">Jenjang yang Dibimbing</p>
              <div className="flex flex-wrap gap-3">
                {EDUCATION_LEVELS.map((lvl) => {
                  const checked = levels.includes(lvl);
                  return (
                    <label key={lvl} className="flex items-center gap-1.5 text-[13px]">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) =>
                          setLevels(c ? [...levels, lvl] : levels.filter((x) => x !== lvl))
                        }
                      />
                      <span>{EDUCATION_LEVEL_LABELS[lvl]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Spesialisasi (pisahkan dengan koma)" htmlFor="adm-m-spec">
              <Input id="adm-m-spec" value={specialtiesText} onChange={(e) => setSpecialtiesText(e.target.value)} />
            </Field>

            <Field label="Tag Minat (untuk Algoritma Kecocokan)" htmlFor="adm-m-interests">
              <InterestPicker value={interests} onChange={setInterests} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tarif per Sesi (IDR, 0 = Gratis)" htmlFor="adm-m-price">
                <Input id="adm-m-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Field label="Durasi Sesi (Menit)" htmlFor="adm-m-min">
                <Input id="adm-m-min" type="number" min={30} max={90} step={15} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
              </Field>
            </div>
          </div>
        </DetailSection>

        {selected ? (
          <DetailSection title="Statistik">
            <FactList
              items={[
                { label: "Username", value: selected.username },
                { label: "Sesi Selesai", value: String(selected.sessionsCompleted) },
              ]}
            />
          </DetailSection>
        ) : null}
      </DetailSheet>
    </div>
  );
}
