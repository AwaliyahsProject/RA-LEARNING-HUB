# Database — RA Learning Hub

Supabase PostgreSQL. **Semua perubahan skema lewat migrasi** di
`supabase/migrations/` (format `YYYYMMDDHHMMSS_nama.sql`). Tidak ada perubahan
destruktif tanpa migrasi; tidak ada rename/drop kolom yang berisi data tanpa
langkah migrasi data.

Legenda status: ✅ sudah ada di migrasi · 🗓️ direncanakan (fase di kurung).

## 1. Konvensi

- PK `uuid default gen_random_uuid()`.
- Kolom audit pada tabel penting: `created_at`, `updated_at`, `created_by`,
  `updated_by` — diisi otomatis oleh trigger `private.set_audit_fields()`.
- **Data sekolah** wajib punya `school_id uuid not null references schools`.
  Index pada `school_id` (dan kombinasi yang sering difilter).
- **Konten global** tidak punya `school_id`; konten custom sekolah memakai
  `owner_school_id` (NULL = milik platform).
- Enum Postgres hanya untuk nilai yang benar-benar tetap (mis. `user_role`).
  Daftar yang bisa berbeda per sekolah (sentra, area, domain, skala asesmen)
  disimpan sebagai **tabel data**.
- RLS **aktif di setiap tabel** `public`. `anon` tidak diberi hak apa pun.

## 2. Fondasi (Phase 1–2) ✅

Migrasi: `20261003000100_foundation.sql`, `20261003000200_invitations.sql`

### `schools` ✅ — akar tenant
`id, name, npsn (8 digit), nsm (12 digit), address, village, district, regency,
province, phone, email, logo_url, timezone (Asia/Jakarta|Asia/Makassar|Asia/Jayapura),
is_active, created_at, updated_at, created_by, updated_by`

### `profiles` ✅ — satu baris per pengguna auth
`id (= auth.users.id), full_name, email, avatar_url, role (user_role), school_id,
is_active, …audit`
- Constraint: `super_admin` tidak boleh punya `school_id`.
- Dibuat otomatis oleh trigger `on_auth_user_created` dari `app_metadata`
  (`role`: `school_admin`|`teacher`, `school_id`). `super_admin` **tidak pernah**
  diberikan via metadata — hanya lewat SQL oleh pemilik platform.
- Trigger `profiles_guard_update` mencegah eskalasi (lihat SECURITY.md).

Kolom status undangan (Phase 2, migrasi `20261003000200_invitations.sql`):
`invited_at` (dari `auth.users.invited_at`), `invited_by` (dari `app_metadata`),
`joined_at` (dari `auth.users.email_confirmed_at`; NULL = menunggu). Ketiganya
dikelola trigger dan tidak bisa diubah pengguna.

### Enum `user_role` ✅
`super_admin`, `school_admin`, `teacher`

### Trigger pada `auth.users` ✅
| Trigger | Fungsi |
| --- | --- |
| `on_auth_user_created` | buat profil; terapkan `app_metadata` bila sudah ada |
| `on_auth_user_updated` | sinkron `email`, `invited_at`, `joined_at`; terapkan `app_metadata` **sekali** (selama profil belum punya sekolah) |

> GoTrue menulis `app_metadata` lewat UPDATE setelah INSERT. Karena itu
> penugasan juga berjalan saat UPDATE. Ini ditemukan saat uji di Supabase asli.

### Fungsi helper (skema `private`) ✅
| Fungsi | Hasil |
| --- | --- |
| `private.auth_role()` | role pengguna aktif saat ini (NULL bila nonaktif) |
| `private.auth_school_id()` | sekolah pengguna aktif saat ini |
| `private.is_super_admin()` | boolean |
| `private.is_school_admin_of(school uuid)` | admin sekolah tersebut? |
| `private.is_member_of(school uuid)` | anggota aktif sekolah tersebut? |

| `private.teaches_class(class uuid)` | pengguna aktif ini ditugaskan di kelas tersebut? (dipakai Phase 4+) |
| `private.path_school_id(name text)` | segmen pertama path Storage sebagai uuid (NULL bila bukan uuid) |

## 3. Struktur akademik (Phase 3) ✅

Migrasi: `20261005000100_academic_structure.sql`

**Integritas tenant dengan FK komposit:** tabel anak menyimpan `school_id` dan
menunjuk induknya lewat `(id, school_id)`. Database sendiri menolak relasi lintas
sekolah, misalnya guru Sekolah B di kelas Sekolah A, atau kelas yang menunjuk
tahun ajaran sekolah lain.

### `academic_years` ✅
`id, school_id, name ('2026/2027'), start_date, end_date, is_active, …audit`
- `end_date > start_date`; nama unik per sekolah.
- **Satu tahun ajaran aktif per sekolah**: partial unique index
  `academic_years_one_active_idx`.
- RPC `public.set_active_academic_year(target uuid)` (SECURITY INVOKER) mengganti
  tahun aktif secara atomik.
- Tidak bisa dihapus selama masih punya kelas (FK restrict).

### `classes` ✅
`id, school_id, academic_year_id, name, level (enum class_level: A|B), …audit`
- FK komposit `(academic_year_id, school_id)` → `academic_years (id, school_id)`.
- Nama unik per tahun ajaran.
- `learning_model_id` **ditunda ke Phase 7** bersama tabel `learning_models`.

### `class_teachers` ✅
`id, school_id, class_id, teacher_id, role (enum class_teacher_role: homeroom|assistant), …audit`
- FK komposit ke `classes (id, school_id)` (cascade) dan `profiles (id, school_id)`.
- Satu guru sekali per kelas; **maksimal satu wali kelas** (partial unique index).
- Menggantikan kolom `homeroom_teacher_id` di spesifikasi awal agar kelas bisa
  punya wali + beberapa pendamping.

### RLS
Baca: anggota sekolah (dan super admin). Tulis: `school_admin` sekolah itu (dan
super admin).

### Storage: bucket `school-logos` ✅
Bucket **publik** karena logo adalah informasi publik dan dipakai di dokumen
cetak. Batas 1 MB; tipe PNG/JPEG/WebP. Path: `{school_id}/logo-{timestamp}.{ext}`.
`schools.logo_url` menyimpan **path di bucket**, bukan URL penuh (lihat
`src/features/schools/storage.ts`). Tulis/hapus hanya `school_admin` untuk folder
sekolahnya. File sensitif (foto siswa, portofolio) akan memakai bucket privat.

## 4. Rencana skema (fase berikutnya) 🗓️

### Peserta didik (Phase 4)
- `students` — `school_id, nis, nisn, full_name, nickname, gender, birth_place, birth_date, parent_name, parent_phone, address, photo_url, status`.
- `student_enrollments` — `student_id, class_id, academic_year_id` (riwayat kelas per tahun ajaran; spesifikasi awal menaruh `class_id` di `students`, dipisah agar kenaikan kelas tidak menimpa riwayat).
- ~~`school_invitations`~~ — tidak diperlukan; status undangan ada di `profiles` (Phase 2).

### Konfigurasi pembelajaran (Phase 5 & 7)
- `learning_models` — `school_id NULL` = bawaan sistem (Kelompok, Area, Sentra, Custom); sekolah bisa menambah.
- `learning_centers` (sentra), `learning_areas` (area), `learning_groups` (kelompok) — `school_id, name, description, is_active, sequence`.
- `development_domains` — `school_id NULL` = default platform (mengikuti pedoman KMA RA — daftar final dikonfirmasi pemilik produk), sekolah bisa override.
- `assessment_scales` + `assessment_scale_levels` — default BB/MB/BSH/BSB, bisa diganti.

### Kurikulum & konten global (Phase 5–6)
- `content_packs` → `content_pack_items (pack_id, item_type, item_id, sequence)` — paket bulanan, polymorphic ringan.
- `themes (title, month, description, cover_image, age_group, content_status)` → `subthemes` → `topics`.
- `learning_objectives (theme_id, subtheme_id, domain_id, title, description, age_level, sequence)`.
- `activities` — field lengkap sesuai spesifikasi + `owner_school_id` (NULL = global) + `status (draft|review|published|archived)`.
- `activity_variants (activity_id, age_level 'A'|'B', title, instructions, difficulty, teacher_prompt, worksheet_id, assessment_template_id)` — unik `(activity_id, age_level)`.
- `activity_learning_models`, `activity_centers`, `activity_areas`, `activity_groups` — implementasi per model.
- `worksheets` (LKPD), `assessment_templates` (bank asesmen).

### Buku (Phase 8)
- `books (title, subtitle, book_type 'student'|'teacher'|'printable', age_level, theme_id, cover_url, status, version)`.
- `book_sections (book_id, title, sequence)` → `book_pages (book_section_id, page_number, title, content_type, content jsonb, image_url, activity_id, worksheet_id, objective_id)`.
- `book_bookmarks (profile_id, book_page_id, kind 'bookmark'|'favorite')`.

### Pembelajaran & bukti (Phase 9–12)
- `lesson_plans` — field sesuai spesifikasi + `status (draft|final)`.
- `lesson_plan_activities (lesson_plan_id, source_activity_id, source_variant_id, age_level, learning_model_id, center_id/area_id/group_id, duration_minutes, snapshot jsonb, sequence)` — **snapshot** yang bisa disunting.
- `assessments` — sesuai spesifikasi + `scale_level_id`, `assessment_type`.
- `anecdotal_notes (student_id, date, activity_id, observation, interpretation, follow_up)`.
- `portfolio_items (student_id, item_type, assessment_id?, anecdotal_note_id?, media_id?, activity_id?, objective_id?, date, teacher_id)`.
- `media_files (school_id, bucket, path, mime_type, size_bytes, uploaded_by)`.
- `report_cards (student_id, academic_year_id, semester, status)` + `report_narratives (report_card_id, domain_id, draft_text, final_text, source 'teacher'|'ai_draft', approved_by, approved_at)`.

## 5. Menjalankan tes database

```bash
# Postgres biasa (bukan project Supabase)
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:test
```

Runner membuat database sementara, memasang stub `auth` dan `storage` ala Supabase
(`supabase/rls-tests/_harness`), menjalankan semua migrasi, lalu tes di
`supabase/rls-tests/*.sql`, dan menghapus database tersebut.

## 6. Tipe TypeScript

`src/types/supabase.ts` **di-generate** dari skema lokal dengan
`npm run db:types` (butuh `npx supabase start`). Jangan diedit manual.
Jalankan setelah setiap migrasi baru. Tipe khusus aplikasi ada di
`src/types/database.ts`.
