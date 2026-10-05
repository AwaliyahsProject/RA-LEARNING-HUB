"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { friendlyDbError } from "@/lib/errors";
import { fieldErrorsFrom, readFields, type FormState } from "@/lib/forms";
import {
  createSchoolSchema,
  detectImageType,
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  schoolProfileSchema,
  type CreateSchoolField,
  type SchoolProfileField,
} from "./schemas";
import { SCHOOL_LOGO_BUCKET } from "./storage";

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

const PROFILE_FIELDS = [
  "name", "nsm", "npsn", "address", "village", "district", "regency", "province", "phone", "email", "timezone",
] as const;

function revalidateSchool() {
  revalidatePath("/", "layout"); // school name + logo appear in the app shell
}

export async function updateSchoolProfile(
  _prev: FormState<SchoolProfileField>,
  formData: FormData,
): Promise<FormState<SchoolProfileField>> {
  const profile = await requireRole(["school_admin"]);
  const values = readFields(formData, PROFILE_FIELDS);
  const parsed = schoolProfileSchema.safeParse(values);
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<SchoolProfileField>(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").update(parsed.data).eq("id", profile.schoolId!).select("id");
  if (error) return { status: "error", values, message: friendlyDbError(error, "updateSchoolProfile") };
  if (!data.length) return { status: "error", values, message: "Anda tidak memiliki izin mengubah profil sekolah ini." };

  revalidateSchool();
  return { status: "success", values, message: "Profil sekolah tersimpan." };
}

export async function uploadSchoolLogo(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole(["school_admin"]);
  const schoolId = profile.schoolId!;
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Pilih file logo terlebih dahulu." };
  if (file.size > LOGO_MAX_BYTES) return { status: "error", message: "Ukuran logo maksimal 1 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { status: "error", message: "Logo harus berupa gambar PNG, JPG, atau WebP." };

  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("logo_url").eq("id", schoolId).maybeSingle();

  // Unique name per upload so browsers/CDN never show a stale cached logo.
  const path = `${schoolId}/logo-${Date.now()}.${LOGO_TYPES[type]}`;
  const { error: uploadError } = await supabase.storage
    .from(SCHOOL_LOGO_BUCKET)
    .upload(path, bytes, { contentType: type, upsert: false, cacheControl: "31536000" });
  if (uploadError) {
    console.error("[storage] uploadSchoolLogo:", uploadError.message);
    return { status: "error", message: "Logo belum terunggah. Periksa koneksi internet lalu coba lagi." };
  }

  const { error } = await supabase.from("schools").update({ logo_url: path }).eq("id", schoolId);
  if (error) {
    await supabase.storage.from(SCHOOL_LOGO_BUCKET).remove([path]);
    return { status: "error", message: friendlyDbError(error, "uploadSchoolLogo.update") };
  }

  if (school?.logo_url && school.logo_url !== path) {
    await supabase.storage.from(SCHOOL_LOGO_BUCKET).remove([school.logo_url]);
  }

  revalidateSchool();
  return { status: "success", message: "Logo sekolah diperbarui." };
}

export async function removeSchoolLogo(): Promise<FormState> {
  const profile = await requireRole(["school_admin"]);
  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("logo_url").eq("id", profile.schoolId!).maybeSingle();
  if (!school?.logo_url) return { status: "success", message: "Logo sudah kosong." };

  const { error } = await supabase.from("schools").update({ logo_url: null }).eq("id", profile.schoolId!);
  if (error) return { status: "error", message: friendlyDbError(error, "removeSchoolLogo") };
  await supabase.storage.from(SCHOOL_LOGO_BUCKET).remove([school.logo_url]);

  revalidateSchool();
  return { status: "success", message: "Logo dihapus." };
}
