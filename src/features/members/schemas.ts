import { z } from "zod";

export const inviteMemberSchema = z.object({
  schoolId: z.uuid("Sekolah tidak valid."),
  fullName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 huruf.")
    .max(150, "Nama terlalu panjang."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email wajib diisi.")
    .pipe(z.email("Format email belum benar.")),
  role: z.enum(["teacher", "school_admin"], { error: "Pilih peran." }),
});

export type InviteMemberField = "fullName" | "email" | "role";

export const memberIdSchema = z.uuid();
