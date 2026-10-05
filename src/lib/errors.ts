import "server-only";

type DbError = { code?: string; message?: string } | null | undefined;

/**
 * Translate a PostgREST/Postgres error into a teacher-friendly message.
 * The raw error is logged server-side and never sent to the browser.
 * `overrides` lets a caller give a more specific message per error code,
 * e.g. { "23505": "Nama kelas sudah dipakai di tahun ajaran ini." }.
 */
export function friendlyDbError(error: DbError, context: string, overrides: Record<string, string> = {}): string {
  console.error(`[db] ${context}:`, error?.code, error?.message);
  const code = error?.code ?? "";
  if (overrides[code]) return overrides[code];
  switch (code) {
    case "23505":
      return "Data yang sama sudah ada.";
    case "23503":
      return "Data ini masih dipakai oleh data lain sehingga belum bisa dihapus atau diubah.";
    case "23514":
    case "22P02":
    case "22007":
    case "22008":
      return "Ada isian yang formatnya belum sesuai.";
    case "42501":
      return "Anda tidak memiliki izin untuk melakukan ini.";
    case "PGRST116":
      return "Data tidak ditemukan atau Anda tidak memiliki akses.";
    default:
      return "Maaf, perubahan belum tersimpan. Periksa koneksi internet lalu coba lagi.";
  }
}
