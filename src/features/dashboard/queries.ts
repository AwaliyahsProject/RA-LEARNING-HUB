import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SetupStatus = {
  profileComplete: boolean;
  hasActiveYear: boolean;
  hasTeachers: boolean;
  hasClasses: boolean;
};

/** Progress of the school setup checklist, computed from real data (counts only). */
export async function getSchoolSetupStatus(schoolId: string): Promise<SetupStatus> {
  const supabase = await createClient();
  const [school, activeYear, teachers] = await Promise.all([
    supabase.from("schools").select("address, regency, province").eq("id", schoolId).maybeSingle(),
    supabase.from("academic_years").select("id").eq("school_id", schoolId).eq("is_active", true).maybeSingle(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role", "teacher"),
  ]);

  let hasClasses = false;
  if (activeYear.data) {
    const { count } = await supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("academic_year_id", activeYear.data.id);
    hasClasses = (count ?? 0) > 0;
  }

  return {
    profileComplete: Boolean(school.data?.address && school.data.regency && school.data.province),
    hasActiveYear: Boolean(activeYear.data),
    hasTeachers: (teachers.count ?? 0) > 0,
    hasClasses,
  };
}
