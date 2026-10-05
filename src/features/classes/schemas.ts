import { z } from "zod";

export const CLASS_LEVEL_LABELS = { A: "Kelompok A (4–5 tahun)", B: "Kelompok B (5–6 tahun)" } as const;
export const CLASS_TEACHER_ROLE_LABELS = { homeroom: "Wali kelas", assistant: "Guru pendamping" } as const;

export const classSchema = z.object({
  academicYearId: z.uuid("Pilih tahun ajaran."),
  name: z.string().trim().min(1, "Nama kelas wajib diisi.").max(60, "Nama kelas terlalu panjang."),
  level: z.enum(["A", "B"], { error: "Pilih kelompok A atau B." }),
});

export type ClassField = "academicYearId" | "name" | "level";

export const updateClassSchema = classSchema.omit({ academicYearId: true }).extend({ classId: z.uuid() });

export const assignTeacherSchema = z.object({
  classId: z.uuid(),
  teacherId: z.uuid("Pilih guru."),
  role: z.enum(["homeroom", "assistant"], { error: "Pilih peran." }),
});

export const removeTeacherSchema = z.object({ classId: z.uuid(), assignmentId: z.uuid() });
