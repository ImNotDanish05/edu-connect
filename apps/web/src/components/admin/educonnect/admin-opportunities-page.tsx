"use client";

import { useState } from "react";
import { Plus, Trophy } from "lucide-react";
import {
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
  type OpportunityKind,
  type OpportunityStatus,
} from "@open-lms/types";
import { Button, Checkbox, Field, Input, NativeSelect, Switch, Textarea, toast } from "@open-lms/ui";
import { DataTable, type Column } from "@/components/admin/shell/data-table";
import { DetailSection, DetailSheet } from "@/components/admin/shell/detail-sheet";
import { FilterBar } from "@/components/admin/shell/filter-bar";
import { CountdownTimer } from "@/components/educonnect/common/countdown-timer";
import { LevelChips } from "@/components/educonnect/common/level-chips";
import { StatusBadge } from "@/components/educonnect/common/status-badge";
import { VerifiedBadge } from "@/components/educonnect/common/verified-badge";
import { useAdminOpportunities, useAdminUpsertOpportunity } from "@/lib/educonnect/hooks";
import type { StoredOpportunity } from "@/lib/educonnect/mock-store";

type StatusTab = "ALL" | OpportunityStatus;

export function AdminOpportunitiesPage() {
  const [tab, setTab] = useState<StatusTab>("ALL");
  const [q, setQ] = useState("");
  const oppsQuery = useAdminOpportunities();
  const upsertOpp = useAdminUpsertOpportunity();

  const [selected, setSelected] = useState<StoredOpportunity | null>(null);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<OpportunityKind>("SCHOLARSHIP");
  const [organizer, setOrganizer] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [reqsText, setReqsText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [levels, setLevels] = useState<EducationLevel[]>(["SMA"]);
  const [location, setLocation] = useState("Online");
  const [registrationUrl, setRegistrationUrl] = useState("https://beasiswa.kemdikbud.go.id");
  const [daysAhead, setDaysAhead] = useState("14");
  const [isVerified, setIsVerified] = useState(true);
  const [status, setStatus] = useState<OpportunityStatus>("PUBLISHED");

  const openEditor = (o: StoredOpportunity | null) => {
    if (o) {
      setSelected(o);
      setCreating(false);
      setTitle(o.title);
      setKind(o.kind);
      setOrganizer(o.organizer);
      setSummary(o.summary);
      setDescription(o.descriptionHtml.replace(/<\/?p>/g, "\n").trim());
      setReqsText(o.requirements.join("\n"));
      setBenefitsText(o.benefits.join("\n"));
      setLevels(o.educationLevels);
      setLocation(o.location ?? "Online");
      setRegistrationUrl(o.registrationUrl);
      const diffDays = Math.max(1, Math.round((Date.parse(o.deadlineAt) - Date.now()) / 86400_000));
      setDaysAhead(String(diffDays));
      setIsVerified(o.isVerified);
      setStatus(o.status);
    } else {
      setSelected(null);
      setCreating(true);
      setTitle("");
      setKind("SCHOLARSHIP");
      setOrganizer("");
      setSummary("");
      setDescription("");
      setReqsText("Siswa aktif SMA/SMK sederajat\nRata-rata rapor minimal 80");
      setBenefitsText("Dana bantuan pendidikan\nSertifikat nasional");
      setLevels(["SMA"]);
      setLocation("Online");
      setRegistrationUrl("https://kemdikbud.go.id");
      setDaysAhead("14");
      setIsVerified(true);
      setStatus("PUBLISHED");
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !organizer.trim()) {
      toast.error({ title: "Judul dan penyelenggara wajib diisi" });
      return;
    }
    const deadlineIso = new Date(Date.now() + (Number(daysAhead) || 14) * 86400_000).toISOString();
    await upsertOpp.mutateAsync({
      id: selected?.id,
      title,
      kind,
      organizer,
      summary: summary || title,
      description: description || summary || title,
      requirements: reqsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      benefits: benefitsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      educationLevels: levels,
      tags: [kind === "SCHOLARSHIP" ? "Beasiswa" : "Lomba"],
      location,
      registrationUrl,
      deadlineAt: deadlineIso,
      isVerified,
      status,
    });
    toast.success({ title: selected ? "Peluang diperbarui" : "Peluang baru dipublikasikan" });
    setSelected(null);
    setCreating(false);
  };

  const filtered = (oppsQuery.data ?? [])
    .filter((o) => (tab === "ALL" ? true : o.status === tab))
    .filter((o) => {
      const term = q.trim().toLowerCase();
      if (!term) return true;
      return `${o.title} ${o.organizer}`.toLowerCase().includes(term);
    });

  const columns: Column<StoredOpportunity>[] = [
    {
      key: "title",
      header: "Judul Peluang",
      cell: (o) => (
        <div>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span>{o.title}</span>
            {o.isVerified ? <VerifiedBadge compact /> : null}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {o.kind === "SCHOLARSHIP" ? "Beasiswa" : "Lomba"} · {o.organizer}
          </p>
        </div>
      ),
    },
    {
      key: "levels",
      header: "Jenjang",
      cell: (o) => <LevelChips levels={o.educationLevels} />,
    },
    {
      key: "deadline",
      header: "Countdown",
      cell: (o) => <CountdownTimer deadlineAt={o.deadlineAt} showPrefix={false} />,
    },
    {
      key: "saves",
      header: "Disimpan",
      align: "right",
      sortValue: (o) => o.saveCount,
      cell: (o) => o.saveCount,
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge status={o.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">Manajemen Opportunity Hub</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Kurasi dan verifikasi informasi beasiswa pendidikan serta olimpiade/lomba pelajar.
          </p>
        </div>
        <Button onClick={() => openEditor(null)} data-testid="admin-add-opportunity">
          <Plus className="size-4" />
          <span>Buat Peluang Baru</span>
        </Button>
      </div>

      <FilterBar
        tabs={[
          { value: "ALL", label: "Semua" },
          { value: "PUBLISHED", label: "Tayang (Published)" },
          { value: "DRAFT", label: "Draf" },
          { value: "ARCHIVED", label: "Arsip" },
        ]}
        tab={tab}
        onTabChange={setTab}
        search={q}
        onSearchChange={setQ}
        searchPlaceholder="Cari judul atau penyelenggara..."
      />

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(o) => o.id}
        caption="Daftar peluang beasiswa dan lomba"
        onRowClick={(o) => openEditor(o)}
        selectedKey={selected?.id ?? null}
        empty={{ icon: <Trophy />, title: "Belum ada peluang pada filter ini" }}
        testId="admin-opportunities-table"
      />

      <DetailSheet
        open={!!selected || creating}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setCreating(false);
          }
        }}
        title={creating ? "Buat Peluang Baru" : selected?.title}
        description={selected?.organizer}
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
            <Button onClick={() => void handleSave()} loading={upsertOpp.isPending} data-testid="admin-save-opportunity">
              Simpan Peluang
            </Button>
          </div>
        }
      >
        <DetailSection title="Status Publikasi & Verifikasi">
          <div className="space-y-3">
            <Field label="Status Tayang" htmlFor="adm-o-status">
              <NativeSelect
                id="adm-o-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
              >
                <option value="PUBLISHED">PUBLISHED (Tayang di Katalog)</option>
                <option value="DRAFT">DRAFT (Disembunyikan)</option>
                <option value="ARCHIVED">ARCHIVED (Diarsipkan)</option>
              </NativeSelect>
            </Field>
            <label className="flex items-center justify-between gap-3 text-[13.5px]">
              <span>Tandai Terverifikasi oleh Admin EduConnect</span>
              <Switch checked={isVerified} onCheckedChange={setIsVerified} />
            </label>
          </div>
        </DetailSection>

        <DetailSection title="Informasi Utama">
          <div className="space-y-3">
            <Field label="Jenis Peluang" htmlFor="adm-o-kind">
              <NativeSelect id="adm-o-kind" value={kind} onChange={(e) => setKind(e.target.value as OpportunityKind)}>
                <option value="SCHOLARSHIP">Beasiswa (SCHOLARSHIP)</option>
                <option value="COMPETITION">Lomba & Kompetisi (COMPETITION)</option>
              </NativeSelect>
            </Field>
            <Field label="Judul Beasiswa / Lomba" htmlFor="adm-o-title">
              <Input id="adm-o-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Penyelenggara" htmlFor="adm-o-org">
              <Input id="adm-o-org" value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Lokasi" htmlFor="adm-o-loc">
                <Input id="adm-o-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
              </Field>
              <Field label="Batas Waktu (Hari dari Sekarang)" htmlFor="adm-o-days">
                <Input id="adm-o-days" type="number" value={daysAhead} onChange={(e) => setDaysAhead(e.target.value)} />
              </Field>
            </div>
            <Field label="Link Pendaftaran Resmi" htmlFor="adm-o-url">
              <Input id="adm-o-url" type="url" value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} />
            </Field>
          </div>
        </DetailSection>

        <DetailSection title="Jenjang & Konten Detail">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[13px] font-medium">Target Jenjang</p>
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
            <Field label="Ringkasan Singkat" htmlFor="adm-o-sum">
              <Textarea id="adm-o-sum" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </Field>
            <Field label="Deskripsi Lengkap" htmlFor="adm-o-desc">
              <Textarea id="adm-o-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Persyaratan (1 baris per poin)" htmlFor="adm-o-reqs">
              <Textarea id="adm-o-reqs" rows={3} value={reqsText} onChange={(e) => setReqsText(e.target.value)} />
            </Field>
            <Field label="Benefit / Hadiah (1 baris per poin)" htmlFor="adm-o-ben">
              <Textarea id="adm-o-ben" rows={3} value={benefitsText} onChange={(e) => setBenefitsText(e.target.value)} />
            </Field>
          </div>
        </DetailSection>
      </DetailSheet>
    </div>
  );
}
