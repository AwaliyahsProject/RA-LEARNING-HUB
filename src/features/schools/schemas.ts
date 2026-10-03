import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .transform((v) => (v === "" ? null : v));

export const SCHOOL_TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB (Jawa, Sumatra, Kalbar, Kalteng)" },
  { value: "Asia/Makassar", label: "WITA (Bali, NTB, NTT, Sulawesi, Kalsel, Kaltim)" },
  { value: "Asia/Jayapura", label: "WIT (Maluku, Papua)" },
] as const;

export const createSchoolSchema = z.object({
  name: z.string().trim().min(3, "Nama sekolah minimal 3 huruf.").max(200, "Nama sekolah terlalu panjang."),
  nsm: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9]{12}$/.test(v), "NSM terdiri dari 12 angka.")
    .transform((v) => (v === "" ? null : v)),
  npsn: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9]{8}$/.test(v), "NPSN terdiri dari 8 angka.")
    .transform((v) => (v === "" ? null : v)),
  regency: optionalText(100),
  province: optionalText(100),
  timezone: z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"], { error: "Pilih zona waktu." }),
});

export type CreateSchoolField = keyof z.input<typeof createSchoolSchema>;
