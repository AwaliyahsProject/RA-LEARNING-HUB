"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { friendlyDbError } from "@/lib/errors";
import { fieldErrorsFrom, readFields, type FormState } from "@/lib/forms";
import { assignTeacherSchema, classSchema, removeTeacherSchema, updateClassSchema, type ClassField } from "./schemas";

const DUPLICATE_NAME = { "23505": "Nama kelas ini sudah dipakai di tahun ajaran yang sama." };

function revalidateClasses(classId?: string) {
  revalidatePath("/sekolah/kelas");
  if (classId) revalidatePath(`/sekolah/kelas/${classId}`);
  revalidatePath("/sekolah/tahun-ajaran");
  revalidatePath("/dashboard");
}

export async function createClass(_prev: FormState<ClassField>, formData: FormData): Promise<FormState<ClassField>> {
  const profile = await requireRole(["school_admin"]);
  const values = readFields(formData, ["academicYearId", "name", "level"] as const);
  const parsed = classSchema.safeParse(values);
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<ClassField>(parsed.error) };

  // school_id comes from the session, never from the form. The composite FK
  // (academic_year_id, school_id) rejects a year belonging to another school.
  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({
    school_id: profile.schoolId!,
    academic_year_id: parsed.data.academicYearId,
    name: parsed.data.name,
    level: parsed.data.level,
  });
  if (error) {
    return {
      status: "error",
      values,
      message: friendlyDbError(error, "createClass", { ...DUPLICATE_NAME, "23503": "Tahun ajaran tidak ditemukan." }),
    };
  }

  revalidateClasses();
  return { status: "success", values: { academicYearId: values.academicYearId, level: values.level }, message: `Kelas ${parsed.data.name} ditambahkan.` };
}

export async function updateClass(_prev: FormState<ClassField>, formData: FormData): Promise<FormState<ClassField>> {
  await requireRole(["school_admin"]);
  const values = readFields(formData, ["classId", "name", "level"] as const);
  const parsed = updateClassSchema.safeParse(values);
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<ClassField>(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .update({ name: parsed.data.name, level: parsed.data.level })
    .eq("id", parsed.data.classId)
    .select("id");
  if (error) return { status: "error", values, message: friendlyDbError(error, "updateClass", DUPLICATE_NAME) };
  if (!data.length) return { status: "error", values, message: "Kelas tidak ditemukan atau Anda tidak memiliki akses." };

  revalidateClasses(parsed.data.classId);
  return { status: "success", values, message: "Data kelas tersimpan." };
}

export async function deleteClass(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["school_admin"]);
  const id = z.uuid().safeParse(formData.get("classId"));
  if (!id.success) return { status: "error", message: "Data kelas tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("classes").delete().eq("id", id.data).select("id, academic_year_id");
  if (error) {
    return {
      status: "error",
      message: friendlyDbError(error, "deleteClass", { "23503": "Kelas ini masih memiliki data siswa atau pembelajaran." }),
    };
  }
  if (!data.length) return { status: "error", message: "Kelas tidak ditemukan atau Anda tidak memiliki akses." };

  revalidateClasses();
  redirect(`/sekolah/kelas?tahun=${data[0].academic_year_id}&pesan=kelas-dihapus`);
}

export async function assignTeacher(
  _prev: FormState<"teacherId" | "role">,
  formData: FormData,
): Promise<FormState<"teacherId" | "role">> {
  const profile = await requireRole(["school_admin"]);
  const values = readFields(formData, ["classId", "teacherId", "role"] as const);
  const parsed = assignTeacherSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", values, fieldErrors: fieldErrorsFrom<"teacherId" | "role">(parsed.error) };
  }

  // Composite FKs guarantee class and teacher both belong to this school.
  const supabase = await createClient();
  const { error } = await supabase.from("class_teachers").insert({
    school_id: profile.schoolId!,
    class_id: parsed.data.classId,
    teacher_id: parsed.data.teacherId,
    role: parsed.data.role,
  });
  if (error) {
    const isHomeroomClash = error.code === "23505" && error.message?.includes("one_homeroom");
    return {
      status: "error",
      values,
      message: isHomeroomClash
        ? "Kelas ini sudah memiliki wali kelas. Hapus wali kelas yang lama terlebih dahulu."
        : friendlyDbError(error, "assignTeacher", {
            "23505": "Guru ini sudah ditugaskan di kelas ini.",
            "23503": "Guru atau kelas tidak ditemukan di sekolah Anda.",
          }),
    };
  }

  revalidateClasses(parsed.data.classId);
  return { status: "success", message: "Guru ditugaskan ke kelas." };
}

export async function removeTeacher(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(["school_admin"]);
  const parsed = removeTeacherSchema.safeParse({ classId: formData.get("classId"), assignmentId: formData.get("assignmentId") });
  if (!parsed.success) return { status: "error", message: "Data penugasan tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_teachers")
    .delete()
    .eq("id", parsed.data.assignmentId)
    .eq("class_id", parsed.data.classId)
    .select("id");
  if (error) return { status: "error", message: friendlyDbError(error, "removeTeacher") };
  if (!data.length) return { status: "error", message: "Penugasan tidak ditemukan." };

  revalidateClasses(parsed.data.classId);
  return { status: "success", message: "Guru dilepas dari kelas." };
}
