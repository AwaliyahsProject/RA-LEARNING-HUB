# Arsitektur — RA Learning Hub

> Dokumen ini wajib sinkron dengan implementasi. Status per fitur ada di
> [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md).

## 1. Gambaran besar

```
Browser (mobile-first)                       Vercel / Node
┌──────────────────────┐   HTTPS   ┌─────────────────────────────────────┐
│ React Client Comp.   │──────────▶│ proxy.ts  (refresh sesi, redirect)  │
│ (form, nav, dialog)  │           │ Server Components (baca data)       │
└──────────────────────┘           │ Server Actions    (tulis data, Zod) │
                                   └──────────────┬──────────────────────┘
                                                  │ JWT pengguna (RLS aktif)
                                   ┌──────────────▼──────────────────────┐
                                   │ Supabase: Auth · Postgres+RLS ·      │
                                   │ Storage                              │
                                   └─────────────────────────────────────┘
```

- **Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4.**
- Data **dibaca** di Server Components dan **ditulis** lewat Server Actions.
  Tidak ada API palsu; Route Handler dipakai hanya bila perlu (callback auth,
  export file, webhook).
- Semua query memakai client Supabase **ber-JWT pengguna**, sehingga **RLS
  adalah lapisan otorisasi utama**. Pengecekan di frontend hanya untuk UX.
- `service_role` hanya dipakai di `src/lib/supabase/admin.ts` (dilindungi
  `server-only`) untuk operasi yang memang tidak boleh dilakukan pengguna biasa
  (mis. undangan dengan `app_metadata`). Pemanggil wajib lolos `requireRole()`.

## 2. Lapisan keamanan (defense in depth)

| Lapisan | File | Fungsi |
| --- | --- | --- |
| Proxy | `src/proxy.ts`, `src/lib/supabase/proxy.ts` | Refresh cookie sesi, redirect optimistis ke `/login`. **Bukan** otorisasi. |
| DAL | `src/lib/auth/session.ts` | `requireProfile()`, `requireRole()`, `canAccessApp()` — dipanggil di setiap layout/page/action privat. |
| Validasi | `src/features/*/schemas.ts` | Zod di server untuk setiap input. |
| Database | `supabase/migrations/*` | RLS per tabel + trigger guard kolom sensitif. |

Detail: [SECURITY.md](SECURITY.md).

## 3. Struktur folder

```
src/
  app/
    (auth)/login/           Halaman publik (login; nanti: terima undangan, reset sandi)
    (app)/                  Area terproteksi — layout memanggil requireProfile()
      dashboard/
      pembelajaran/…        (fase berikutnya) kalender, tema, buku, aktivitas, rpph, lkpd
      anak/…                (fase berikutnya) siswa, asesmen, anekdot, portofolio
      laporan/…             (fase berikutnya)
      sekolah/…             (fase berikutnya) area Kepala Sekolah
      admin/…               (fase berikutnya) area Super Admin
  components/
    ui/                     Primitif: Button, Card, Badge, Alert, EmptyState, LoadingState, ErrorState
    layout/                 AppShell, NavList (sidebar), MobileNavigation, PageHeader, Brand, UserPanel
  config/                   navigation.ts (menu per role), routes.ts
  features/<modul>/         schemas.ts (Zod) · actions.ts (Server Actions) · queries.ts · komponen modul
  lib/
    supabase/               server.ts · client.ts · proxy.ts · admin.ts (server-only)
    auth/                   session.ts (DAL) · roles.ts
    env.ts · datetime.ts · utils.ts
  types/database.ts         Tipe DB (format `supabase gen types`)
supabase/
  config.toml               Konfigurasi Supabase CLI (signup dimatikan — invitation only)
  migrations/               Satu-satunya cara mengubah skema
  rls-tests/                Tes SQL isolasi tenant (dijalankan `npm run db:test`)
scripts/db-test.sh          Runner tes database
```

**Aturan modul:** fitur baru masuk ke `src/features/<nama>/`. Halaman di
`src/app` tipis — memanggil DAL + query, lalu merender komponen fitur.
Komponen yang dipakai ≥ 2 fitur dipindah ke `src/components`.

## 4. Navigasi & role

Menu didefinisikan sebagai **data** di `src/config/navigation.ts` (per role).
Item dengan `ready: false` tampil sebagai "Segera" dan tidak bisa diklik,
sehingga tidak ada link ke halaman yang belum ada. Saat fitur rilis, cukup ubah
`ready: true`.

Mobile: bottom navigation (4 aksi utama per role + tombol **Menu** yang membuka
drawer `<dialog>` native — fokus terkunci & tombol Esc bekerja tanpa library).
Desktop (≥ `lg`): sidebar tetap.

## 5. Desain visual

Token di `src/app/globals.css` (`@theme`): kanvas krem hangat, hijau-sage
(`brand`), aksen peach (`accent`), radius kartu besar, bayangan lembut. Font
Plus Jakarta Sans. Target sentuh minimal 44px, kontras teks ≥ 4.5:1,
`prefers-reduced-motion` dihormati. Tidak ada animasi berlebihan.

## 6. Keputusan arsitektur (ADR ringkas)

| # | Keputusan | Alasan |
| --- | --- | --- |
| 1 | `profiles.id = auth.users.id` (tanpa kolom `auth_user_id` terpisah) | Satu identitas, join lebih sederhana, pola standar Supabase. |
| 2 | Role & sekolah dari `app_metadata`, bukan `user_metadata` | `user_metadata` bisa diubah pengguna sendiri → celah eskalasi. |
| 3 | Helper RLS di skema `private` (SECURITY DEFINER) | Tidak terekspos lewat Data API; menghindari rekursi policy pada `profiles`. |
| 4 | Undangan oleh admin, signup publik dimatikan | Keputusan produk (Phase 1). |
| 5 | Konten global: `school_id`/`owner_school_id` NULL; data sekolah: `school_id` NOT NULL | Pemisahan Global Content vs School Data. |
| 6 | RPPH menyimpan **snapshot** aktivitas + referensi ke sumber | Guru bebas menyunting tanpa mengubah konten global. |
| 7 | Model pembelajaran = tabel relasi implementasi, bukan kolom di `activities` | One content, multiple implementations. |
| 8 | Domain perkembangan & skala asesmen = data konfigurasi | Tidak mengunci pada satu kurikulum/skala. |
| 9 | `schools.timezone` (WIB/WITA/WIT) | "Hari ini" berbeda antar wilayah Indonesia. |
| 10 | Rute privat selalu request-time (`connection()`/`cookies()`) | Data per pengguna tidak boleh di-prerender saat build. |

## 7. Kesiapan offline (rencana, belum diimplementasi)

Arsitektur disiapkan agar kelak bisa menambah: autosave draft (form menyimpan
draft ke `localStorage` + kolom `status = 'draft'` di server), cache baca untuk
aktivitas/buku (Service Worker, read-only). **Tidak** ada sinkronisasi tulis
offline palsu yang berisiko kehilangan data.
