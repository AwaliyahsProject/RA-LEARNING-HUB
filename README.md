# RA Learning Hub

**Administrasi • Pembelajaran • Buku Tema • Asesmen**

Platform pembelajaran terintegrasi untuk Raudhatul Athfal (RA) / TK Islam.
Aplikasi ini menghubungkan rantai kurikulum → tema → buku → aktivitas → RPPH →
asesmen → portofolio → rapor dalam satu aplikasi multi-sekolah (multi-tenant).

> Status: **Phase 1 (Fondasi) selesai.** Lihat
> [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md).

## Teknologi

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · Supabase
(Auth, Postgres + RLS, Storage) · Zod · Lucide · Vitest · Vercel-compatible.

## Menjalankan secara lokal

Prasyarat: Node.js ≥ 22.

```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase
npm run dev                  # http://localhost:3000
```

Tanpa kredensial Supabase, aplikasi tetap berjalan dan halaman login
menampilkan petunjuk konfigurasi.

### Opsi A — Supabase lokal (butuh Docker)

```bash
npx supabase start           # menjalankan stack lokal + menerapkan migrasi
npx supabase status          # salin API URL & publishable/anon key ke .env.local
```

### Opsi B — Project Supabase cloud

1. Buat project di <https://supabase.com/dashboard>.
2. **Project Settings → API**: salin URL dan publishable/anon key ke
   `.env.local`. Service role key hanya untuk server dan **jangan** diberi
   prefiks `NEXT_PUBLIC_`.
3. Terapkan migrasi: `npx supabase link --project-ref <ref>` lalu
   `npx supabase db push`.
4. **Authentication → Sign In / Providers**: matikan *Allow new users to sign up*
   (aplikasi ini hanya menerima undangan).

### Membuat Super Admin pertama

Super admin tidak bisa dibuat lewat aplikasi atau metadata. Caranya:

1. Supabase Dashboard → **Authentication → Users → Add user** (email + kata
   sandi, centang *Auto confirm*).
2. **SQL Editor**:
   ```sql
   update public.profiles set role = 'super_admin', school_id = null
   where email = 'email-anda@contoh.id';
   ```

Fitur undangan Kepala Sekolah dan guru dibangun di Phase 2.

## Script

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` / `npm start` | Build dan jalankan production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate tipe route Next.js + `tsc --noEmit` |
| `npm test` | Unit test (Vitest) |
| `npm run db:test` | Migrasi + tes RLS/isolasi tenant di Postgres sementara (`TEST_DATABASE_URL`) |

## Dokumentasi

- [ARCHITECTURE.md](ARCHITECTURE.md): arsitektur aplikasi dan keputusan desain
- [DATABASE.md](DATABASE.md): skema yang sudah ada dan rencana skema
- [CONTENT_ARCHITECTURE.md](CONTENT_ARCHITECTURE.md): content engine, varian A/B, model pembelajaran, buku
- [SECURITY.md](SECURITY.md): RLS, role, dan tes keamanan
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md): fase dan keputusan produk
- [CHANGELOG.md](CHANGELOG.md): catatan perubahan

## Konvensi Git

Commit bermakna dengan awalan: `feat:`, `fix:`, `security:`, `docs:`,
`chore:`, `test:`. Perubahan skema **hanya** lewat file migrasi baru.
