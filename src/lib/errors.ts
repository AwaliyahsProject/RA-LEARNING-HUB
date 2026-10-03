import "server-only";

type DbError = { code?: string; message?: string } | null | undefined;

/**
 * Translate a PostgREST/Postgres error into a teacher-friendly message.
 * The raw error is logged server-side and never sent to the browser.
 */
export function friendlyDbError(error: DbError, context: string): string {
  console.error(`[db] ${context}:`, error?.code, error?.message);
  switch (error?.code) {
    case "23505":
      return "Data yang sama sudah ada.";
    case "23514":
    case "22P02":
      return "Ada isian yang formatnya belum sesuai.";
    case "42501":
      return "Anda tidak memiliki izin untuk melakukan ini.";
    case "PGRST116":
      return "Data tidak ditemukan atau Anda tidak memiliki akses.";
    default:
      return "Maaf, perubahan belum tersimpan. Periksa koneksi internet lalu coba lagi.";
  }
}
