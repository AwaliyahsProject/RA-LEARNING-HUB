import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  classCount: number;
};

const COLUMNS = "id, name, start_date, end_date, is_active, classes(count)";

type Row = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  classes: { count: number }[] | null;
};

function toAcademicYear(r: Row): AcademicYear {
  return {
    id: r.id,
    name: r.name,
    startDate: r.start_date,
    endDate: r.end_date,
    isActive: r.is_active,
    classCount: r.classes?.[0]?.count ?? 0,
  };
}

/** All academic years of a school, newest first. `null` = could not load. */
export async function listAcademicYears(schoolId: string): Promise<AcademicYear[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .select(COLUMNS)
    .eq("school_id", schoolId)
    .order("start_date", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[db] listAcademicYears:", error.code, error.message);
    return null;
  }
  return data.map(toAcademicYear);
}

export async function getAcademicYear(id: string): Promise<AcademicYear | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_years").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) console.error("[db] getAcademicYear:", error.code, error.message);
  return data ? toAcademicYear(data) : null;
}
