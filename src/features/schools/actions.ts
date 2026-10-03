"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { friendlyDbError } from "@/lib/errors";
import { fieldErrorsFrom, readFields, type FormState } from "@/lib/forms";
import { createSchoolSchema, type CreateSchoolField } from "./schemas";

const FIELDS = ["name", "nsm", "npsn", "regency", "province", "timezone"] as const;

export async function createSchool(_prev: FormState<CreateSchoolField>, formData: FormData): Promise<FormState<CreateSchoolField>> {
  await requireRole(["super_admin"]);
  const values = readFields(formData, FIELDS);
  const parsed = createSchoolSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", values, fieldErrors: fieldErrorsFrom<CreateSchoolField>(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").insert(parsed.data).select("id").single();
  if (error) return { status: "error", values, message: friendlyDbError(error, "createSchool") };

  revalidatePath("/admin/sekolah");
  redirect(`/admin/sekolah/${data.id}?baru=1`);
}
