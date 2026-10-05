import { z } from "zod";
import { SCHOOL_TIMEZONE_VALUES } from "@/types/database";

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
  timezone: z.enum(SCHOOL_TIMEZONE_VALUES, { error: "Pilih zona waktu." }),
});

export type CreateSchoolField = keyof z.input<typeof createSchoolSchema>;

const optionalPattern = (re: RegExp, message: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .refine((v) => v === "" || re.test(v), message)
    .transform((v) => (v === "" ? null : v));

/** School profile edited by the school admin (superset of the create form). */
export const schoolProfileSchema = createSchoolSchema.extend({
  address: optionalText(300),
  village: optionalText(100),
  district: optionalText(100),
  phone: optionalPattern(/^[0-9+()\-\s]{6,20}$/, "Nomor telepon hanya berisi angka, spasi, +, -, ( ).", 20),
  email: optionalPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email belum benar.", 150),
});

export type SchoolProfileField = keyof z.input<typeof schoolProfileSchema>;

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

/**
 * Check the file's magic bytes, not just its declared type, so a renamed
 * HTML/SVG file can never be stored as a "logo".
 */
export function detectImageType(bytes: Uint8Array): keyof typeof LOGO_TYPES | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
