"use client";

import { useState } from "react";
import { Gift, Heart, Package } from "lucide-react";
import type { DonationStatus, KitboxDonation, KitboxPackage, KitboxRequest, KitboxRequestStatus } from "@open-lms/types";
import { Button, Field, Input, NativeSelect, Textarea, toast } from "@open-lms/ui";
import { DataTable, type Column } from "@/components/admin/shell/data-table";
import { DetailSection, DetailSheet, FactList } from "@/components/admin/shell/detail-sheet";
import { FilterBar } from "@/components/admin/shell/filter-bar";
import { LevelChips } from "@/components/educonnect/common/level-chips";
import { StatusBadge } from "@/components/educonnect/common/status-badge";
import {
  useAdminUpdateKitboxDonation,
  useAdminUpdateKitboxRequest,
  useAdminUpsertKitboxPackage,
  useKitboxPackages,
  useMyKitbox,
} from "@/lib/educonnect/hooks";
import { formatWibDateTime } from "@/lib/educonnect/mentor-slots";

type Tab = "requests" | "donations" | "packages";

export function AdminKitboxPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const packagesQuery = useKitboxPackages(true);
  const kitboxQuery = useMyKitbox();

  const updateRequest = useAdminUpdateKitboxRequest();
  const updateDonation = useAdminUpdateKitboxDonation();
  const upsertPkg = useAdminUpsertKitboxPackage();

  const [selectedReq, setSelectedReq] = useState<KitboxRequest | null>(null);
  const [reqStatus, setReqStatus] = useState<KitboxRequestStatus>("APPROVED");
  const [reqNote, setReqNote] = useState("");

  const [selectedDon, setSelectedDon] = useState<KitboxDonation | null>(null);
  const [donStatus, setDonStatus] = useState<DonationStatus>("RECEIVED");
  const [donNote, setDonNote] = useState("");

  const [selectedPkg, setSelectedPkg] = useState<KitboxPackage | null>(null);
  const [pkgStock, setPkgStock] = useState("10");

  const requests = kitboxQuery.data?.requests ?? [];
  const donations = kitboxQuery.data?.donations ?? [];
  const packages = packagesQuery.data ?? [];

  const handleSaveRequest = async () => {
    if (!selectedReq) return;
    try {
      await updateRequest.mutateAsync({
        id: selectedReq.id,
        status: reqStatus,
        adminNote: reqNote.trim() || null,
      });
      toast.success({
        title: "Status pengajuan diperbarui",
        description: "Stok paket & Impact Tracker otomatis disesuaikan.",
      });
      setSelectedReq(null);
    } catch (err) {
      toast.error({ title: err instanceof Error ? err.message : "Gagal memperbarui status" });
    }
  };

  const handleSaveDonation = async () => {
    if (!selectedDon) return;
    await updateDonation.mutateAsync({
      id: selectedDon.id,
      status: donStatus,
      adminNote: donNote.trim() || null,
    });
    toast.success({ title: "Status donasi diperbarui" });
    setSelectedDon(null);
  };

  const handleSavePkgStock = async () => {
    if (!selectedPkg) return;
    await upsertPkg.mutateAsync({
      id: selectedPkg.id,
      name: selectedPkg.name,
      summary: selectedPkg.summary,
      contents: selectedPkg.contents,
      educationLevels: selectedPkg.educationLevels,
      stock: Number(pkgStock) || 0,
      status: "ACTIVE",
    });
    toast.success({ title: "Stok paket KitBox diperbarui" });
    setSelectedPkg(null);
  };

  const requestColumns: Column<KitboxRequest>[] = [
    {
      key: "recipient",
      header: "Penerima",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.recipientName}</p>
          <p className="text-[12px] text-muted-foreground">{r.institution || r.city}</p>
        </div>
      ),
    },
    {
      key: "package",
      header: "Paket KitBox",
      cell: (r) => r.package.name,
    },
    {
      key: "city",
      header: "Kota",
      hideBelow: "sm",
      cell: (r) => r.city,
    },
    {
      key: "createdAt",
      header: "Waktu Pengajuan",
      hideBelow: "md",
      cell: (r) => <span className="text-[12.5px] text-muted-foreground">{formatWibDateTime(r.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const donationColumns: Column<KitboxDonation>[] = [
    {
      key: "donor",
      header: "Donatur",
      cell: (d) => (
        <div>
          <p className="font-medium text-foreground">{d.donorName || "Donatur"}</p>
          <p className="text-[12px] text-muted-foreground">{d.isAnonymous ? "Tampil Anonim" : d.donorContact}</p>
        </div>
      ),
    },
    {
      key: "item",
      header: "Barang Donasi",
      cell: (d) => (
        <div>
          <p className="font-medium">{d.quantity}× {d.itemType}</p>
          <p className="line-clamp-1 max-w-xs text-[12px] text-muted-foreground">{d.itemDescription}</p>
        </div>
      ),
    },
    {
      key: "delivery",
      header: "Metode",
      hideBelow: "sm",
      cell: (d) => d.deliveryMethod,
    },
    {
      key: "status",
      header: "Status",
      cell: (d) => <StatusBadge status={d.status} />,
    },
  ];

  const packageColumns: Column<KitboxPackage>[] = [
    {
      key: "name",
      header: "Nama Paket",
      cell: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          <p className="text-[12px] text-muted-foreground">{p.contents.length} item di dalam paket</p>
        </div>
      ),
    },
    {
      key: "levels",
      header: "Jenjang",
      cell: (p) => <LevelChips levels={p.educationLevels} />,
    },
    {
      key: "stock",
      header: "Sisa Stok",
      align: "right",
      cell: (p) => <span className="font-semibold tabular-nums">{p.stock} paket</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">Manajemen Educational KitBox</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Kelola antrean pengajuan klaim gratis (stok berkurang otomatis saat disetujui), verifikasi donasi masuk, dan atur stok paket.
        </p>
      </div>

      <FilterBar
        tabs={[
          { value: "requests", label: `Pengajuan Klaim (${requests.length})` },
          { value: "donations", label: `Donasi Masuk (${donations.length})` },
          { value: "packages", label: `Stok Paket (${packages.length})` },
        ]}
        tab={tab}
        onTabChange={setTab}
      />

      {tab === "requests" ? (
        <DataTable
          rows={requests}
          columns={requestColumns}
          rowKey={(r) => r.id}
          caption="Antrean pengajuan klaim KitBox"
          onRowClick={(r) => {
            setSelectedReq(r);
            setReqStatus(r.status);
            setReqNote(r.adminNote ?? "");
          }}
          selectedKey={selectedReq?.id ?? null}
          empty={{ icon: <Gift />, title: "Belum ada pengajuan klaim" }}
          testId="admin-kitbox-requests-table"
        />
      ) : null}

      {tab === "donations" ? (
        <DataTable
          rows={donations}
          columns={donationColumns}
          rowKey={(d) => d.id}
          caption="Antrean donasi KitBox"
          onRowClick={(d) => {
            setSelectedDon(d);
            setDonStatus(d.status);
            setDonNote(d.adminNote ?? "");
          }}
          selectedKey={selectedDon?.id ?? null}
          empty={{ icon: <Heart />, title: "Belum ada donasi masuk" }}
          testId="admin-kitbox-donations-table"
        />
      ) : null}

      {tab === "packages" ? (
        <DataTable
          rows={packages}
          columns={packageColumns}
          rowKey={(p) => p.id}
          caption="Daftar paket KitBox"
          onRowClick={(p) => {
            setSelectedPkg(p);
            setPkgStock(String(p.stock));
          }}
          selectedKey={selectedPkg?.id ?? null}
          empty={{ icon: <Package />, title: "Belum ada paket KitBox" }}
          testId="admin-kitbox-packages-table"
        />
      ) : null}

      {/* Sheet: Review Claim Request */}
      <DetailSheet
        open={!!selectedReq}
        onOpenChange={(o) => !o && setSelectedReq(null)}
        title={selectedReq ? `Klaim: ${selectedReq.package.name}` : ""}
        description={selectedReq?.recipientName}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedReq(null)}>
              Tutup
            </Button>
            <Button onClick={() => void handleSaveRequest()} loading={updateRequest.isPending} data-testid="admin-save-request">
              Simpan Status
            </Button>
          </div>
        }
      >
        {selectedReq ? (
          <>
            <DetailSection title="Detail Penerima & Alasan">
              <FactList
                items={[
                  { label: "Nama Penerima", value: selectedReq.recipientName },
                  { label: "WhatsApp / HP", value: selectedReq.phone ?? "-" },
                  { label: "Sekolah / Kampus", value: selectedReq.institution ?? "-" },
                  { label: "Kota", value: selectedReq.city },
                  { label: "Alamat Pengiriman", value: selectedReq.shippingAddress ?? "-" },
                  { label: "Alasan Pengajuan", value: selectedReq.reason },
                ]}
              />
            </DetailSection>
            <DetailSection title="Keputusan Admin (Otomatis Mengatur Stok)">
              <div className="space-y-3">
                <Field label="Status Pengajuan" htmlFor="adm-req-status">
                  <NativeSelect
                    id="adm-req-status"
                    value={reqStatus}
                    onChange={(e) => setReqStatus(e.target.value as KitboxRequestStatus)}
                    data-testid="admin-request-status-select"
                  >
                    <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
                    <option value="APPROVED">APPROVED (Disetujui - Kurangi 1 Stok)</option>
                    <option value="SHIPPED">SHIPPED (Sedang Dikirim)</option>
                    <option value="DELIVERED">DELIVERED (Diterima Siswa)</option>
                    <option value="REJECTED">REJECTED (Ditolak - Kembalikan Stok)</option>
                  </NativeSelect>
                </Field>
                <Field label="Catatan Admin untuk Siswa" htmlFor="adm-req-note">
                  <Textarea
                    id="adm-req-note"
                    rows={3}
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="Contoh: Disetujui, nomor resi pengiriman akan diperbarui..."
                  />
                </Field>
              </div>
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      {/* Sheet: Review Donation */}
      <DetailSheet
        open={!!selectedDon}
        onOpenChange={(o) => !o && setSelectedDon(null)}
        title="Verifikasi Donasi Barang"
        description={selectedDon?.donorName}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedDon(null)}>
              Tutup
            </Button>
            <Button onClick={() => void handleSaveDonation()} loading={updateDonation.isPending}>
              Simpan Status Donasi
            </Button>
          </div>
        }
      >
        {selectedDon ? (
          <>
            <DetailSection title="Informasi Barang">
              <FactList
                items={[
                  { label: "Donatur", value: selectedDon.donorName ?? "-" },
                  { label: "Kontak", value: selectedDon.donorContact ?? "-" },
                  { label: "Jumlah", value: `${selectedDon.quantity} pcs` },
                  { label: "Kondisi", value: selectedDon.condition },
                  { label: "Metode", value: selectedDon.deliveryMethod },
                  { label: "Deskripsi", value: selectedDon.itemDescription },
                ]}
              />
            </DetailSection>
            <DetailSection title="Update Status Penerimaan">
              <div className="space-y-3">
                <Field label="Status Donasi" htmlFor="adm-don-status">
                  <NativeSelect
                    id="adm-don-status"
                    value={donStatus}
                    onChange={(e) => setDonStatus(e.target.value as DonationStatus)}
                  >
                    <option value="PLEDGED">PLEDGED (Menunggu Penyerahan)</option>
                    <option value="RECEIVED">RECEIVED (Diterima di Gudang/Drop Point)</option>
                    <option value="DISTRIBUTED">DISTRIBUTED (Telah Disalurkan ke Siswa)</option>
                    <option value="REJECTED">REJECTED (Tidak Layak Pakai)</option>
                  </NativeSelect>
                </Field>
                <Field label="Catatan Admin" htmlFor="adm-don-note">
                  <Textarea id="adm-don-note" rows={2} value={donNote} onChange={(e) => setDonNote(e.target.value)} />
                </Field>
              </div>
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      {/* Sheet: Package Stock */}
      <DetailSheet
        open={!!selectedPkg}
        onOpenChange={(o) => !o && setSelectedPkg(null)}
        title={selectedPkg?.name}
        description="Atur ketersediaan stok paket KitBox"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedPkg(null)}>
              Batal
            </Button>
            <Button onClick={() => void handleSavePkgStock()} loading={upsertPkg.isPending}>
              Simpan Stok
            </Button>
          </div>
        }
      >
        {selectedPkg ? (
          <DetailSection title="Inventaris Paket">
            <Field label="Jumlah Stok Tersedia" htmlFor="adm-pkg-stock">
              <Input
                id="adm-pkg-stock"
                type="number"
                min={0}
                value={pkgStock}
                onChange={(e) => setPkgStock(e.target.value)}
              />
            </Field>
          </DetailSection>
        ) : null}
      </DetailSheet>
    </div>
  );
}
