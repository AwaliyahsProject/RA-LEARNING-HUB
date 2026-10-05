@AGENTS.md

# RA Learning Hub — aturan kerja untuk agen

Baca dulu: ARCHITECTURE.md, DATABASE.md, CONTENT_ARCHITECTURE.md, SECURITY.md,
DEVELOPMENT_ROADMAP.md. Dokumen-dokumen ini wajib diperbarui di commit yang
sama dengan perubahan kode yang memengaruhinya.

- Kerjakan per fase (lihat roadmap). Laporkan di akhir fase, lalu tunggu
  persetujuan sebelum fase berikutnya.
- Skema hanya diubah lewat migrasi **baru** di `supabase/migrations/`. Jangan
  pernah mengedit migrasi yang sudah ter-push. Setelah migrasi baru, jalankan
  `npm run db:types` (butuh `npx supabase start`); jangan edit
  `src/types/supabase.ts` secara manual.
- Relasi antar data sekolah memakai FK komposit `(id, school_id)`.
- Setiap tabel baru: RLS aktif, `anon` tanpa hak, kolom audit, `school_id` untuk
  data sekolah, dan skenario baru di `supabase/rls-tests/`.
- Halaman/action privat wajib memanggil `requireProfile()`/`requireRole()`.
  Input divalidasi dengan Zod di server. Jangan menampilkan error mentah.
- Jangan meng-hardcode data sekolah, tema, sentra, domain, atau skala asesmen
  di komponen. Semuanya data.
- Teks UI dalam Bahasa Indonesia. Identifier kode dalam Bahasa Inggris.
- Sebelum push: `npm run lint && npm run typecheck && npm test && npm run build && npm run db:test`.
