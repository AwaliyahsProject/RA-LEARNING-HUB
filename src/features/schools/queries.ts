import "server-only";
import { createClient } from "@/lib/supabase/server";

export const SCHOOL_PAGE_SIZE = 25;

export type SchoolListItem = {
  id: string;
  name: string;
  regency: string | null;
  province: string | null;
  isActive: boolean;
  memberCount: number;
};

/** Paginated school list for super admins (RLS returns only visible schools). */
export async function listSchools({ query, page }: { query?: string; page: number }) {
  const supabase = await createClient();
  const from = (page - 1) * SCHOOL_PAGE_SIZE;
  let request = supabase
    .from("schools")
    .select("id, name, regency, province, is_active, profiles(count)", { count: "exact" })
    .order("name")
    .range(from, from + SCHOOL_PAGE_SIZE - 1);

  const q = query?.trim();
  if (q) request = request.ilike("name", `%${q.replace(/[%_\\]/g, "\\$&")}%`);

  const { data, error, count } = await request;
  if (error) {
    console.error("[db] listSchools:", error.code, error.message);
    return null;
  }
  const items: SchoolListItem[] = data.map((s) => ({
    id: s.id,
    name: s.name,
    regency: s.regency,
    province: s.province,
    isActive: s.is_active,
    memberCount: s.profiles?.[0]?.count ?? 0,
  }));
  return { items, total: count ?? items.length };
}

export async function getSchool(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, nsm, npsn, regency, province, timezone, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[db] getSchool:", error.code, error.message);
    return null;
  }
  return data;
}

/** Full profile of one school for the edit form (RLS: members of that school only). */
export async function getSchoolProfile(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, nsm, npsn, address, village, district, regency, province, phone, email, timezone, logo_url")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[db] getSchoolProfile:", error.code, error.message);
  return data;
}
