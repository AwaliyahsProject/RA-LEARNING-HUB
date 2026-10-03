import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .pipe(z.email("Format email belum benar.")),
  password: z.string().min(1, "Kata sandi wajib diisi.").max(128, "Kata sandi terlalu panjang."),
  next: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export type SignInState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
  email?: string;
};

/** Map Supabase auth error codes to teacher-friendly Indonesian messages. */
export function signInErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Email atau kata sandi tidak cocok. Silakan periksa kembali.";
    case "email_not_confirmed":
      return "Email belum dikonfirmasi. Buka tautan undangan di email Anda terlebih dahulu.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
    case "user_banned":
      return "Akun ini sedang dinonaktifkan. Hubungi admin sekolah.";
    default:
      return "Tidak dapat masuk saat ini. Periksa koneksi internet lalu coba lagi.";
  }
}
