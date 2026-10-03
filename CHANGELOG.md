# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).

## [Unreleased]

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
