# Arsitektur Konten — RA Learning Hub

Prinsip: **Content first. One content, multiple implementations.** Konten inti
dipisahkan dari cara sekolah mengorganisasikannya (Kelompok / Area / Sentra /
Custom) dan dari kelompok usia (A / B).

## 1. Rantai inti

```
CONTENT PACK ─▶ THEME ─▶ SUBTHEME ─▶ OBJECTIVE ─▶ ACTIVITY ─▶ ACTIVITY VARIANT (A/B)
                                                       │
                                                       ▼
                                   LEARNING MODEL IMPLEMENTATION (sentra/area/kelompok/custom)
                                                       │
                                                       ▼
                         LESSON PLAN (snapshot) ─▶ ASSESSMENT ─▶ PORTFOLIO ─▶ REPORT
BOOK ─▶ SECTION ─▶ PAGE ──(referensi)──▶ theme · subtheme · activity · worksheet · objective
```

## 2. Global content vs school data

| | Global content | School data |
| --- | --- | --- |
| Pemilik | Platform (Super Admin) | Sekolah (tenant) |
| Contoh | tema, buku, aktivitas, LKPD, bank asesmen, content pack | guru, siswa, kelas, RPPH, asesmen, portofolio |
| Kolom tenant | tidak ada / `owner_school_id IS NULL` | `school_id NOT NULL` |
| Baca | semua pengguna login (hanya `status = 'published'`) | anggota sekolah itu saja |
| Tulis | hanya `super_admin` | sesuai role di sekolah itu |

**Konten custom sekolah** (mis. "+ Buat Aktivitas Sendiri") memakai tabel yang
sama dengan `owner_school_id = <sekolah>`. Hanya sekolah itu yang bisa
membacanya, kecuali kelak dibagikan secara eksplisit.

## 3. Varian A/B

Satu `activity` menyimpan inti (judul, tujuan, bahan, langkah, nilai islami).
`activity_variants` menyimpan bagian yang **berbeda** per kelompok usia:
instruksi, tingkat kesulitan, pertanyaan pemantik, LKPD, template asesmen.

Contoh — *Mengenal Habitat Hewan*
- A: "Mencocokkan gambar hewan dengan rumahnya."
- B: "Mengelompokkan hewan berdasarkan habitat dan menjelaskan alasannya."

## 4. Implementasi model pembelajaran

Model **tidak** disimpan sebagai kolom di `activities`. Relasinya:

- `activity_learning_models` — catatan implementasi umum per model.
- `activity_centers` — aktivitas cocok untuk sentra tertentu (mis. Bahan Alam).
- `activity_areas` — cocok untuk area tertentu (mis. Sains).
- `activity_groups` — catatan untuk model kelompok.

Daftar sentra/area/kelompok adalah **data milik sekolah**, bukan hardcode.
Untuk menghubungkan konten global dengan sentra milik sekolah, relasi global
menunjuk ke **kategori sentra/area** milik platform. Saat guru memakai
aktivitas, kategori itu dipetakan ke sentra/area sekolah. Detail pemetaan
dirancang di Phase 7.

## 5. "Gunakan dalam Pembelajaran"

Dari halaman buku atau aktivitas, langkahnya **Pilih → Sesuaikan → Simpan**,
dalam satu layar atau drawer:

1. kelas → kelompok A/B otomatis dari kelas, bisa diganti
2. tanggal
3. model pembelajaran → sentra/area/kelompok bila relevan
4. durasi dan suntingan langkah
5. simpan ke RPPH (baru atau yang sudah ada pada tanggal itu)

Yang disimpan adalah `lesson_plan_activities.snapshot`, yaitu salinan JSON
yang bisa disunting, ditambah referensi `source_activity_id` dan
`source_variant_id`. Konten global **tidak pernah** ditimpa. Referensi tetap
disimpan untuk analitik dan pelacakan asesmen ke tujuan pembelajaran.

## 6. Content pack

Paket bulanan, misalnya *September — Keluarga Sakinah*, adalah baris di
`content_packs` beserta daftar `content_pack_items`, yaitu buku guru, buku
anak A/B, LKPD, cerita, lagu, proyek, kegiatan islami, dan bank asesmen.
**Bulan atau tema baru ditambahkan lewat data**, tanpa mengubah kode.

## 7. Buku

Buku adalah data terstruktur (`books` → `book_sections` → `book_pages`), bukan
PDF. Setiap halaman bisa menunjuk ke aktivitas, LKPD, atau tujuan, sehingga
pembaca buku dapat menampilkan tombol **Gunakan dalam Pembelajaran** dan
menampilkan aktivitas, LKPD, serta asesmen terkait. Halaman dimuat secara lazy
(per halaman/section), bukan seluruh buku sekaligus.

## 8. Kurikulum default

Domain perkembangan default mengikuti **pedoman kurikulum RA Kemenag (KMA)**
sesuai keputusan pemilik produk. Daftar domain dan rumusan capaian disimpan
sebagai data seed (`development_domains`), sehingga:
- bisa diperbarui bila regulasi berubah,
- sekolah bisa menyesuaikan.

> ⚠️ Daftar final domain/elemen KMA yang dipakai perlu dikonfirmasi oleh
> pemilik produk sebelum Phase 5 (lihat DEVELOPMENT_ROADMAP.md).

## 9. Konten contoh (demo)

Seed demo (Phase 5–6), dengan tema *Keluarga Sakinah*, subtema *Saling
Memaafkan*, dan aktivitas *Amplop Kebaikan* beserta varian A/B dan
implementasi Sentra/Area/Kelompok. Seed hanya berada di file seed, **tidak
pernah** di-hardcode di komponen.
