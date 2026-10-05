"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { friendlyDbError } from "@/lib/errors";
import { fieldErrorsFrom, readFields, type FormState } from "@/lib/forms";
import { academicYearSchema, type AcademicYearField } from "./schemas";

const BASE_PATH = "/sekolah/tahun-ajaran";
const FIELDS = ["name", "startDate", "endDate"] as const;
const DUPLICATE = { "23505": "Tahun ajaran dengan nama ini sudah ada." };

function revalidateYears() {
  revalidatePath(BASE_PATH);
  revalidatePath("/sekolah/kelas");
  revalidatePath("/dashboard");
}

function parse(formData: FormData) {
  const values = readFields(formData, FIELDS);
  const parsed = academicYearSchema.safeParse({ ...values, makeActive: formData.get("makeActive") === "on" });
  return { values, parsed };
}

export async function createAcademicYear(
  _prev: FormState<AcademicYearField>,
  formData: FormData,
): Promise<FormState<AcademicYearField>> {
  const profile = await requireRole(["school_admin"]);
  const schoolId = profile.schoolId!;
  const { values, parsed } = parse(formData);
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<AcademicYearField>(parsed.error) };

  const supabase = await createClient();
  const { count } = await supabase
    .from("academic_years")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const { data, error } = await supabase
    .from("academic_years")
    .insert({
      school_id: schoolId,
      name: parsed.data.name,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    })
    .select("id")
    .single();
  if (error) return { status: "error", values, message: friendlyDbError(error, "createAcademicYear", DUPLICATE) };

  // The first academic year of a school becomes active automatically.
  if (parsed.data.makeActive || count === 0) {
    const { error: rpcError } = await supabase.rpc("set_active_academic_year", { target: data.id });
    if (rpcError) {
      revalidateYears();
      return { status: "error", message: friendlyDbError(rpcError, "createAcademicYear.activate") };
    }
  }

  revalidateYears();
  return { status: "success", message: `Tahun ajaran ${parsed.data.name} tersimpan.` };
}

export async function updateAcademicYear(
  _prev: FormState<AcademicYearField>,
  formData: FormData,
): Promise<FormState<AcademicYearField>> {
  const profile = await requireRole(["school_admin"]);
  const id = z.uuid().safeParse(formData.get("id"));
  const { values, parsed } = parse(formData);
  if (!id.success) return { status: "error", values, message: "Data tahun ajaran tidak valid." };
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<AcademicYearField>(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .update({ name: parsed.data.name, start_date: parsed.data.startDate, end_date: parsed.data.endDate })
    .eq("id", id.data)
    .eq("school_id", profile.schoolId!)
    .select("id");
  if (error) return { status: "error", values, message: friendlyDbError(error, "updateAcademicYear", DUPLICATE) };
  if (!data.length) return { status: "error", values, message: "Tahun ajaran tidak ditemukan." };

  revalidateYears();
  redirect(`${BASE_PATH}?pesan=tersimpan`);
}

export async function activateAcademicYear(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["school_admin"]);
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Data tahun ajaran tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_active_academic_year", { target: id.data });
  if (error) return { status: "error", message: friendlyDbError(error, "activateAcademicYear") };

  revalidateYears();
  return { status: "success", message: "Tahun ajaran aktif diperbarui." };
}

export async function deleteAcademicYear(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole(["school_admin"]);
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Data tahun ajaran tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .delete()
    .eq("id", id.data)
    .eq("school_id", profile.schoolId!)
    .select("id");
  if (error) {
    return {
      status: "error",
      message: friendlyDbError(error, "deleteAcademicYear", {
        "23503": "Tahun ajaran ini masih memiliki kelas. Hapus atau pindahkan kelasnya terlebih dahulu.",
      }),
    };
  }
  if (!data.length) return { status: "error", message: "Tahun ajaran tidak ditemukan." };

  revalidateYears();
  // The deleted row (and its inline message) disappears, so report at page level.
  redirect(`${BASE_PATH}?pesan=dihapus`);
}
