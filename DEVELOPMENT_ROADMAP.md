# Development Roadmap — RA Learning Hub

Pengembangan dilakukan **bertahap**. Setiap fase diakhiri laporan berisi file
yang berubah, migrasi, tes, dan keterbatasan, lalu menunggu persetujuan pemilik
produk sebelum fase berikutnya dimulai.

**Definition of Done:** UI berfungsi, data tersimpan, validasi berjalan,
otorisasi dan RLS teruji, ada state loading/error/empty, layout mobile rapi,
dan fitur lama tetap berfungsi.

## Keputusan produk yang sudah diambil

| Topik | Keputusan |
| --- | --- |
| Supabase | Dihubungkan nanti; migrasi diuji di Postgres lokal + Supabase CLI lokal |
| Onboarding | Super Admin membuat sekolah dan akun Kepala Sekolah; Kepala Sekolah mengundang guru. Tanpa pendaftaran publik. |
| Kurikulum default | Mengikuti pedoman RA Kemenag (KMA), disimpan sebagai data yang bisa dikonfigurasi |
| Ritme | Satu fase, lalu laporan, lalu persetujuan |

## Status fase

| Fase | Lingkup | Status |
| --- | --- | --- |
| 1 | Fondasi: scaffold, design system, AppShell, Supabase client, proxy, migrasi fondasi + RLS, tes, CI, dokumentasi | ✅ Selesai |
| 2 | Auth & role: undangan (Super Admin → Kepala Sekolah → Guru), terima undangan dan set kata sandi, lupa sandi, halaman profil, bootstrap super admin | ⏭️ Berikutnya |
| 3 | Sekolah, tahun ajaran, guru, kelas A/B (+ `class_teachers`) | 🗓️ |
| 4 | Peserta didik + riwayat kelas | 🗓️ |
| 5 | Kurikulum: domain (KMA), tema, subtema, topik, tujuan, content pack + seed demo | 🗓️ |
| 6 | Content engine: aktivitas, varian A/B, LKPD, aktivitas custom sekolah | 🗓️ |
| 7 | Model pembelajaran: Kelompok/Area/Sentra/Custom, sentra/area sekolah, implementasi aktivitas | 🗓️ |
| 8 | Book engine: buku, section, halaman, pembaca, bookmark, "Gunakan dalam Pembelajaran" | 🗓️ |
| 9 | RPPH: snapshot aktivitas, editor, kalender | 🗓️ |
| 10 | Asesmen dengan skala yang bisa dikonfigurasi | 🗓️ |
| 11 | Anekdot, unggah dokumentasi (Storage), portofolio | 🗓️ |
| 12 | Laporan perkembangan dan rapor (draft → disetujui guru) | 🗓️ |
| 13 | Export PDF/DOCX + template cetak | 🗓️ |
| 14 | Asisten AI (draft saja, berbasis konten tervalidasi) | 🗓️ |
| 15 | Hardening: E2E, audit keamanan, performa, deployment | 🗓️ |

## Perlu konfirmasi pemilik produk

- [ ] **Sebelum Phase 5:** daftar domain/elemen perkembangan dan rumusan
  capaian sesuai KMA RA yang dipakai (nomor KMA atau dokumen sumber).
- [ ] **Sebelum Phase 2:** penyedia email (SMTP) untuk undangan di production.
  Bawaan Supabase dibatasi beberapa email per jam.
- [ ] **Sebelum Phase 12:** format rapor yang diinginkan (contoh dokumen).
- [ ] **Sebelum Phase 14:** penyedia AI dan batas biaya.

## Di luar MVP (arsitektur disiapkan, belum dibangun)

Portal orang tua, WhatsApp, pembayaran/langganan, presensi, pertumbuhan dan
kesehatan, inventaris, keuangan, tanda tangan digital, kolaborasi guru, impor
kurikulum, marketplace konten, paket buku yang bisa diunduh.
