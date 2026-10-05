# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).

## [Unreleased]

### Phase 3 — Sekolah, Tahun Ajaran & Kelas (2026-10-05)

#### Ditambahkan
- **Profil Sekolah** (Kepala Sekolah): identitas, alamat, kontak, zona waktu, dan
  unggah logo (PNG/JPG/WebP ≤ 1 MB, dicek lewat magic bytes). Logo tampil di
  app shell.
- **Tahun Ajaran**: tambah (saran otomatis tahun berjalan), ubah, hapus (bila
  belum punya kelas), dan jadikan aktif. Tahun pertama otomatis aktif.
- **Kelas** Kelompok A/B per tahun ajaran; detail kelas dengan wali kelas dan
  guru pendamping.
- Dashboard Kepala Sekolah: checklist persiapan yang tercentang otomatis dari
  data. Dashboard Guru: **Kelas Saya**.
- Migrasi `20261005000100_academic_structure.sql`: `academic_years`, `classes`,
  `class_teachers`, enum `class_level` dan `class_teacher_role`, RPC
  `set_active_academic_year`, helper `teaches_class`, bucket `school-logos` +
  policy Storage.
- Tipe DB di-generate (`npm run db:types`).
- Tes: 74 assertion SQL, 40 unit test, 33 cek E2E Phase 3 (+39 E2E Phase 2 diulang).

#### Diperbaiki
- Pesan sukses yang hilang bersama baris yang dihapus (hapus tahun ajaran,
  lepas guru) kini tampil di level halaman/induk.

### Phase 2 — Autentikasi & Peran (2026-10-03)

#### Ditambahkan
- Super Admin: daftar sekolah (cari + halaman), tambah sekolah (NSM/NPSN
  tervalidasi, zona waktu), detail sekolah dengan anggota & undangan Kepala Sekolah.
- Kepala Sekolah: halaman **Guru & Admin**: undang guru/admin, kirim ulang
  undangan, nonaktifkan (dengan konfirmasi) / aktifkan kembali.
- Alur email: `/auth/confirm` (token_hash), halaman **Atur Kata Sandi**
  (undangan & reset), **Lupa kata sandi**, template email Bahasa Indonesia.
- **Profil Saya**: ubah nama dan kata sandi; tautan profil di panel pengguna.
- Komponen form bersama: `FormField`, `TextInput`, `SelectInput`,
  `SubmitButton`, `FormMessage`, `ConfirmDialog`; helper `FormState`,
  `friendlyDbError`.
- Migrasi `20261003000200_invitations.sql`: `profiles.invited_at`,
  `invited_by`, `joined_at` + sinkronisasi dari `auth.users`.
- Tes: 46 assertion SQL, 30 unit test, 39 cek E2E (Supabase lokal + Mailpit).

#### Diperbaiki
- Mengundang email yang masih tertunda tidak lagi "berhasil" diam-diam
  (Supabase mengirim ulang alih-alih menolak).
- Guard profil tidak lagi bergantung pada tidak adanya JWT, sehingga update
  sistem dari trigger auth tidak terblokir.

### Phase 1 — Fondasi (2026-10-03)

#### Ditambahkan
- Scaffold Next.js 16 (App Router, TypeScript strict, Tailwind CSS v4, ESLint).
- Design token bernuansa hangat dan pastel, font Plus Jakarta Sans, target
  sentuh minimal 44px, dukungan `prefers-reduced-motion`.
- Komponen UI: `Button`, `Card`, `Badge`, `Alert`, `EmptyState`,
  `LoadingState`, `ErrorState`.
- Layout: `AppShell` (sidebar desktop), `MobileNavigation` (bottom nav + drawer
  `<dialog>`), `NavList`, `PageHeader`, `Brand`, `UserPanel`.
- Navigasi per role (Guru, Kepala Sekolah, Super Admin) sebagai konfigurasi
  data. Fitur yang belum rilis ditandai "Segera".
- Integrasi Supabase: client server/browser, `proxy.ts` untuk refresh sesi,
  client admin (server-only), validasi env dengan Zod.
- Data Access Layer: `requireProfile`, `requireRole`, `canAccessApp`.
- Login email + kata sandi (Server Action + Zod, pesan error Bahasa Indonesia),
  logout, pencegahan open redirect.
- Dashboard per role: Guru (Pembelajaran Hari Ini, Aksi Cepat), Kepala Sekolah
  (langkah persiapan), Super Admin (jumlah sekolah dan pengguna dari database).
- Migrasi `20261003000100_foundation.sql`: `schools`, `profiles`, enum
  `user_role`, helper RLS di skema `private`, trigger audit, trigger pembuatan
  profil, guard eskalasi role, dan policy RLS.
- Tes isolasi tenant SQL (`npm run db:test`) dan unit test Vitest.
- CI GitHub Actions: lint, typecheck, unit test, build, serta migrasi dan tes
  RLS di Postgres 16.
- Konfigurasi Supabase CLI (`supabase/config.toml`): signup publik dimatikan,
  kata sandi minimal 8 karakter berisi huruf dan angka.
- Dokumentasi: README, ARCHITECTURE, DATABASE, CONTENT_ARCHITECTURE,
  DEVELOPMENT_ROADMAP, SECURITY, `.env.example`.
