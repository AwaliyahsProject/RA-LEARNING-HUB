import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ClassLevel, ClassTeacherRole } from "@/types/database";

export type ClassTeacher = { assignmentId: string; teacherId: string; name: string; role: ClassTeacherRole };
export type ClassSummary = { id: string; name: string; level: ClassLevel; teachers: ClassTeacher[] };

const CLASS_COLUMNS =
  "id, name, level, academic_year_id, class_teachers(id, role, teacher:profiles!class_teachers_teacher_fkey(id, full_name, email))";

type TeacherRow = {
  id: string;
  role: ClassTeacherRole;
  teacher: { id: string; full_name: string; email: string | null } | null;
};

function toTeachers(rows: TeacherRow[] | null): ClassTeacher[] {
  return (rows ?? [])
    .filter((r) => r.teacher)
    .map((r) => ({
      assignmentId: r.id,
      teacherId: r.teacher!.id,
      name: r.teacher!.full_name || r.teacher!.email || "Tanpa nama",
      role: r.role,
    }))
    // Homeroom first, then alphabetical.
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, "id") : a.role === "homeroom" ? -1 : 1));
}

/** Classes of one academic year (RLS limits to the caller's school). */
export async function listClasses(academicYearId: string): Promise<ClassSummary[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(CLASS_COLUMNS)
    .eq("academic_year_id", academicYearId)
    .order("level")
    .order("name")
    .limit(200);
  if (error) {
    console.error("[db] listClasses:", error.code, error.message);
    return null;
  }
  return data.map((c) => ({ id: c.id, name: c.name, level: c.level, teachers: toTeachers(c.class_teachers) }));
}

export async function getClass(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(`${CLASS_COLUMNS}, academic_year:academic_years!classes_academic_year_fkey(id, name, is_active)`)
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[db] getClass:", error.code, error.message);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    level: data.level,
    academicYear: data.academic_year,
    teachers: toTeachers(data.class_teachers),
  };
}

/** Active members of a school who can be assigned to classes. */
export async function listAssignableTeachers(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("full_name")
    .limit(300);
  if (error) {
    console.error("[db] listAssignableTeachers:", error.code, error.message);
    return [];
  }
  return data.map((p) => ({ id: p.id, name: p.full_name || p.email || "Tanpa nama", role: p.role }));
}

export type MyClass = { id: string; name: string; level: ClassLevel; role: ClassTeacherRole; yearName: string };

/** Classes the current teacher is assigned to in the school's active academic year. */
export async function listMyClasses(profileId: string): Promise<MyClass[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_teachers")
    .select(
      "role, class:classes!class_teachers_class_fkey!inner(id, name, level, academic_year:academic_years!classes_academic_year_fkey!inner(name, is_active))",
    )
    .eq("teacher_id", profileId)
    .eq("class.academic_year.is_active", true);
  if (error) {
    console.error("[db] listMyClasses:", error.code, error.message);
    return null;
  }
  return data
    .filter((r) => r.class)
    .map((r) => ({
      id: r.class.id,
      name: r.class.name,
      level: r.class.level,
      role: r.role,
      yearName: r.class.academic_year.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}
