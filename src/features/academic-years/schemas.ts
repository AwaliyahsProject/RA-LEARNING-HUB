import { z } from "zod";

const MAX_SPAN_DAYS = 450;

export const academicYearSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^[0-9]{4}\/[0-9]{4}$/, "Tulis seperti 2026/2027.")
      .refine((v) => {
        const [a, b] = v.split("/").map(Number);
        return b === a + 1;
      }, "Tahun kedua harus satu tahun setelah tahun pertama."),
    startDate: z.iso.date("Isi tanggal mulai."),
    endDate: z.iso.date("Isi tanggal selesai."),
    makeActive: z.boolean().default(false),
  })
  .refine((d) => d.endDate > d.startDate, { path: ["endDate"], message: "Tanggal selesai harus setelah tanggal mulai." })
  .refine(
    (d) => (Date.parse(d.endDate) - Date.parse(d.startDate)) / 86_400_000 <= MAX_SPAN_DAYS,
    { path: ["endDate"], message: "Rentang tahun ajaran terlalu panjang." },
  );

export type AcademicYearField = "name" | "startDate" | "endDate";

/** Suggest the academic year containing `today` (Indonesia: starts in July). */
export function suggestAcademicYear(today: Date = new Date()) {
  const y = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  return { name: `${y}/${y + 1}`, startDate: `${y}-07-01`, endDate: `${y + 1}-06-30` };
}
