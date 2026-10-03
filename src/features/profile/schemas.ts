import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 huruf.").max(150, "Nama terlalu panjang."),
});

/** Mirrors supabase/config.toml: min 8 chars, letters + digits. */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter.")
      .max(72, "Kata sandi maksimal 72 karakter.")
      .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf.")
      .regex(/[0-9]/, "Kata sandi harus mengandung angka."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Konfirmasi kata sandi tidak sama." });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email wajib diisi.").pipe(z.email("Format email belum benar.")),
});

export function passwordErrorMessage(code: string | undefined): string {
  switch (code) {
    case "same_password":
      return "Kata sandi baru harus berbeda dari kata sandi lama.";
    case "weak_password":
      return "Kata sandi terlalu lemah. Gunakan minimal 8 karakter berisi huruf dan angka.";
    case "reauthentication_needed":
      return "Demi keamanan, silakan keluar lalu masuk kembali sebelum mengganti kata sandi.";
    default:
      return "Kata sandi belum tersimpan. Periksa koneksi internet lalu coba lagi.";
  }
}
