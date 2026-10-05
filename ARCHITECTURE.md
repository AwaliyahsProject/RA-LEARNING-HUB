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
    (auth)/login/           Masuk (publik)
    (auth)/lupa-sandi/      Minta tautan reset (publik, tidak membocorkan email terdaftar)
    (auth)/atur-sandi/      Buat kata sandi setelah undangan/reset (butuh sesi)
    auth/confirm/route.ts   Verifikasi token dari email → set sesi → redirect
    (app)/                  Area terproteksi — layout memanggil requireProfile()
      dashboard/
      pembelajaran/…        (fase berikutnya) kalender, tema, buku, aktivitas, rpph, lkpd
      anak/…                (fase berikutnya) siswa, asesmen, anekdot, portofolio
      laporan/…             (fase berikutnya)
      profil/               Profil Saya (semua role)
      sekolah/              Kepala Sekolah: profil sekolah + logo
      sekolah/tahun-ajaran/ Tahun ajaran (tambah, ubah, aktifkan, hapus)
      sekolah/kelas/        Kelas Kelompok A/B per tahun ajaran + guru kelas
      sekolah/guru/         Kepala Sekolah: anggota & undangan
      admin/sekolah/        Super Admin: daftar, tambah, detail sekolah + undang Kepala Sekolah
  components/
    ui/                     Primitif: Button, Card, Badge, Alert, EmptyState, LoadingState, ErrorState,
                            FormField/TextInput/SelectInput, SubmitButton, FormMessage, ConfirmDialog
    layout/                 AppShell, NavList (sidebar), MobileNavigation, PageHeader, Brand, UserPanel
  config/                   navigation.ts (menu per role), routes.ts
  features/<modul>/         schemas.ts (Zod) · actions.ts (Server Actions) · queries.ts · komponen modul
  lib/
    supabase/               server.ts · client.ts · proxy.ts · admin.ts (server-only)
    auth/                   session.ts (DAL) · roles.ts
    forms.ts (FormState, fieldErrorsFrom) · errors.ts (friendlyDbError) · env.ts · datetime.ts · utils.ts
  types/supabase.ts         Tipe DB hasil generate (`npm run db:types`) — jangan diedit manual
  types/database.ts         Re-export + tipe aplikasi (UserRole, ClassLevel, SchoolTimezone)
supabase/
  config.toml               Konfigurasi Supabase CLI (signup dimatikan — invitation only)
  migrations/               Satu-satunya cara mengubah skema
  rls-tests/                Tes SQL isolasi tenant (dijalankan `npm run db:test`)
  templates/                Template email Auth (undangan, reset sandi)
scripts/db-test.sh          Runner tes database
```

**Aturan modul:** fitur baru masuk ke `src/features/<nama>/`. Halaman di
`src/app` tipis — memanggil DAL + query, lalu merender komponen fitur.
Komponen yang dipakai ≥ 2 fitur dipindah ke `src/components`.

## 4. Pola form

Server Action + `useActionState` (React 19) + Zod di server. Action
mengembalikan `FormState` (`status`, `message`, `fieldErrors`, `values`). Nilai
yang diketik dikembalikan agar tidak hilang saat validasi gagal. Ini menggantikan
React Hook Form: lebih sedikit JavaScript di HP, validasi tetap di server, dan
form tetap berfungsi sebelum JavaScript termuat. Error database diterjemahkan oleh
`friendlyDbError()`; detail mentah hanya masuk log server.

## 5. Alur undangan

```
Admin isi form ─▶ inviteMember (requireRole + canInvite + cek email sudah ada?)
   ─▶ service role: inviteUserByEmail ─▶ updateUserById(app_metadata: role, school_id, invited_by)
   ─▶ trigger DB: profil mendapat role & sekolah (sekali saja)
Email ─▶ /auth/confirm?token_hash&type=invite ─▶ verifyOtp (sesi) ─▶ /atur-sandi ─▶ dashboard
```

Status anggota (Aktif / Menunggu undangan / Nonaktif) diturunkan dari
`profiles.joined_at` dan `is_active`.

**Catatan redirect:** karena `(app)/loading.tsx` men-stream shell lebih dulu,
redirect dari `requireRole()` di halaman terjadi di client (respons awal 200).
Konten halaman terlarang tidak ikut dikirim; ini diuji di E2E.

## 6. Navigasi & role

Menu didefinisikan sebagai **data** di `src/config/navigation.ts` (per role).
Item dengan `ready: false` tampil sebagai "Segera" dan tidak bisa diklik,
sehingga tidak ada link ke halaman yang belum ada. Saat fitur rilis, cukup ubah
`ready: true`.

Mobile: bottom navigation (4 aksi utama per role + tombol **Menu** yang membuka
drawer `<dialog>` native — fokus terkunci & tombol Esc bekerja tanpa library).
Desktop (≥ `lg`): sidebar tetap.

## 7. Desain visual

Token di `src/app/globals.css` (`@theme`): kanvas krem hangat, hijau-sage
(`brand`), aksen peach (`accent`), radius kartu besar, bayangan lembut. Font
Plus Jakarta Sans. Target sentuh minimal 44px, kontras teks ≥ 4.5:1,
`prefers-reduced-motion` dihormati. Tidak ada animasi berlebihan.

## 8. Keputusan arsitektur (ADR ringkas)

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
| 11 | Status undangan disimpan di `profiles` (bukan tabel terpisah) | Disinkronkan dari `auth.users` oleh trigger; tidak perlu membuka `auth.users` ke aplikasi. |
| 12 | Server Actions + `useActionState`, bukan React Hook Form | Lihat §4. |
| 13 | Tautan email memakai `token_hash` → `/auth/confirm` | Cocok untuk sesi berbasis cookie (SSR); template email ada di `supabase/templates`. |
| 14 | FK komposit `(id, school_id)` untuk relasi antar data sekolah | Isolasi tenant dijamin juga oleh integritas data, bukan hanya RLS. |
| 15 | Wali kelas + pendamping di `class_teachers` (bukan `classes.homeroom_teacher_id`) | Satu kelas bisa punya beberapa guru; dasar akses guru per kelas. |
| 16 | Logo di bucket publik `school-logos`; isi file dicek lewat magic bytes | Logo bukan data sensitif; validasi isi mencegah SVG/HTML berbahaya diunggah sebagai "gambar". |
| 17 | Tipe DB di-generate dari skema | Menghindari tipe manual yang menyimpang dari database. |
| 18 | Pesan hasil aksi yang menghapus baris ditampilkan di level halaman/induk | Pesan di dalam baris yang dihapus ikut hilang (ditemukan saat E2E). |

## 9. Kesiapan offline (rencana, belum diimplementasi)

Arsitektur disiapkan agar kelak bisa menambah: autosave draft (form menyimpan
draft ke `localStorage` + kolom `status = 'draft'` di server), cache baca untuk
aktivitas/buku (Service Worker, read-only). **Tidak** ada sinkronisasi tulis
offline palsu yang berisiko kehilangan data.
