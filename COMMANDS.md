# Cheat Sheet Perintah EduConnect

Panduan ringkas dan *to-the-point* untuk menjalankan sistem di folder `edu-connect/`.

---

## 1. `make dev-up` *(Rekomendasi Utama untuk Koding)*
Menjalankan service latar belakang saja di Docker (PostgreSQL, Redis, Mailpit, Mock Payment/Video, dan auto-migrasi DB), **tanpa** menjalankan container web & api.

```bash
make dev-up
```

Setelah `make dev-up` selesai, jalankan server kodingan di terminal laptop (agar Hot-Reload aktif saat mengedit kode):
- **Terminal 1 (Backend API)**:
  ```bash
  cd edu-connect
  pnpm --filter @open-lms/api dev
  ```
- **Terminal 2 (Frontend Web)**:
  ```bash
  cd edu-connect
  pnpm --filter @open-lms/web dev
  ```

---

## 2. `make up` *(Full Docker Mode)*
Menjalankan **seluruh sistem** di dalam Docker (termasuk container web & api). Cocok untuk simulasi lingkungan produksi, tapi tidak disarankan saat aktif mengedit kode frontend karena tidak ada hot-reload instan.

```bash
make up
```

---

## 3. `make down` *(Matikan & Reset Data ke 0)*
Mematikan semua container Docker **dan menghapus volume database** (`-v`). Seluruh data testing/akun akan terhapus bersih dan ter-reset dari 0 saat dijalankan kembali.

```bash
make down
```

> **Tips:** Jika hanya ingin mematikan Docker sementara **tanpa menghapus data**, gunakan:
> ```bash
> docker compose -f deploy/compose/compose.yaml stop
> ```

---

## Port Penting
- **Web App**: http://localhost:3530
- **API**: http://localhost:5026
- **Mailpit (Cek Email Testing)**: http://localhost:8046
- **Postgres DB**: `localhost:5492`
- **Redis**: `localhost:6429`
