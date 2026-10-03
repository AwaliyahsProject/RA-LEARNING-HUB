# Keamanan — RA Learning Hub

## Prinsip

1. **Database adalah penegak keamanan.** Row Level Security (RLS) aktif di
   setiap tabel. Filter di frontend hanya untuk kenyamanan, bukan keamanan.
2. **Isolasi tenant.** Pengguna Sekolah A tidak bisa membaca atau mengubah data
   Sekolah B, termasuk siswa, RPPH, portofolio, dan dokumen.
3. **Least privilege.** Role `anon` tidak punya hak apa pun pada tabel aplikasi.
4. **Tanpa rahasia di browser.** Hanya `NEXT_PUBLIC_SUPABASE_URL` dan
   publishable/anon key yang boleh sampai ke client.

## Role

| Role | Cakupan |
| --- | --- |
| `super_admin` | Platform, semua tenant dan konten global. Tidak terikat sekolah. |
| `school_admin` | Sekolahnya sendiri: profil sekolah, guru, kelas, siswa, monitoring. |
| `teacher` | Sekolahnya sendiri; ke depan dibatasi lagi ke kelas yang ditugaskan (`class_teachers`). |

## Mekanisme yang sudah ada (Phase 1)

- **Helper RLS** di skema `private` (`SECURITY DEFINER`, `search_path = ''`).
  Skema ini tidak terekspos lewat Data API dan `EXECUTE` dicabut dari `public`.
- **Akun nonaktif** (`profiles.is_active = false`) otomatis kehilangan semua
  akses karena helper hanya membaca profil aktif.
- **Pembuatan profil** lewat trigger `on_auth_user_created`:
  - role dan sekolah diambil dari `raw_app_meta_data`, yang hanya bisa ditulis
    service role;
  - `super_admin` tidak pernah diberikan via metadata.
- **Guard kolom** `profiles_guard_update` (sejak Phase 2 `SECURITY INVOKER`:
  aturan berlaku bila update dijalankan role `authenticated`; tulisan sistem dari
  trigger auth/service role dipercaya):
  - pengguna biasa tidak bisa mengubah `id`, `school_id`, atau `email`;
  - hanya `school_admin` yang bisa mengubah `role`/`is_active` milik orang lain
    di sekolahnya, dan tidak pernah ke/dari `super_admin`;
  - tidak ada yang bisa mengubah role atau status miliknya sendiri;
  - `invited_at`, `invited_by`, `joined_at` hanya diubah sistem.
- **Signup publik dimatikan** (`supabase/config.toml`): akun hanya dibuat lewat
  undangan admin (Phase 2).
- **Proxy** hanya me-refresh sesi dan me-redirect. Otorisasi dilakukan oleh
  DAL (`requireProfile`/`requireRole`) dan RLS.
- **Open redirect dicegah**: parameter `?next=` hanya menerima path relatif
  same-origin (`safeRedirectPath`, ada unit test-nya).
- **Pesan error ramah**: kode error auth dipetakan ke pesan Bahasa Indonesia.
  Error mentah database tidak pernah ditampilkan.
- **Service role** hanya ada di `src/lib/supabase/admin.ts` (`server-only`),
  tanpa prefiks `NEXT_PUBLIC_`.

## Undangan & kata sandi (Phase 2)

- Undangan hanya lewat Server Action yang memanggil `requireRole()` +
  `canInvite()` sebelum memakai service role. Kepala Sekolah hanya ke
  sekolahnya sendiri; tidak ada yang bisa mengundang `super_admin`.
- Sebelum mengundang, email dicek ke semua sekolah. Supabase diam-diam
  *mengirim ulang* undangan untuk email yang belum diterima, sehingga tanpa cek
  ini akun bisa tampak "terundang" padahal tetap di sekolah lain.
- Jika penugasan `app_metadata` gagal, akun yang baru dibuat dihapus agar tidak
  ada akun yatim.
- Kirim ulang dan aktifkan/nonaktifkan: target dibaca dengan client pengguna
  (RLS) lalu dicek `canManageMember()`. Update `is_active` memakai client
  pengguna, sehingga RLS dan guard memeriksa ulang. E2E memastikan form yang
  dimanipulasi untuk menargetkan guru sekolah lain ditolak.
- `/auth/confirm` memvalidasi parameter dengan Zod, menghapus sesi lama sebelum
  `verifyOtp`, dan tautan yang sudah dipakai atau dipalsukan diarahkan ke login
  dengan pesan ramah.
- Lupa kata sandi selalu menjawab sama (tidak membocorkan email terdaftar).
  Kata sandi minimal 8 karakter berisi huruf dan angka, divalidasi di
  server (Zod) dan Supabase Auth (`config.toml`).

## Tes keamanan

`npm run db:test` menjalankan `supabase/rls-tests/*.sql` (46 assertion), yang
mencakup:
- `anon` ditolak;
- guru A hanya melihat sekolah dan rekan dari Sekolah A;
- guru A tidak bisa mengubah atau menghapus data Sekolah B;
- tidak bisa promosi diri atau pindah sekolah;
- admin A tidak bisa menyentuh Sekolah B dan tidak bisa memberi `super_admin`;
- akun nonaktif dan akun tanpa sekolah tidak melihat apa pun;
- super admin melihat semua.

Suite ini sudah diverifikasi **gagal** ketika sebuah policy sengaja
dilemahkan.

Setiap tabel baru **wajib** menambah skenario ke suite ini. Minimal: baca dan
ubah lintas tenant ditolak.

## Rencana (fase berikutnya)

- Policy Storage per path `schools/{school_id}/…`, dengan validasi MIME dan
  ukuran di server dan di bucket.
- Guru dibatasi ke kelas yang ditugaskan untuk data siswa, asesmen, dan
  portofolio.
- Rate limiting untuk endpoint AI. Konten AI selalu berstatus draft sampai
  guru menyetujui.
- Header keamanan (CSP) setelah daftar domain eksternal final.

## Melaporkan masalah keamanan

Jangan membuka issue publik. Hubungi pemilik repositori secara langsung.
