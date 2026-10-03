import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type MemberRow = {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  schoolId: string | null;
  isActive: boolean;
  invitedAt: string | null;
  joinedAt: string | null;
};

export type MemberStatus = "active" | "pending" | "inactive";

export function memberStatus(m: Pick<MemberRow, "isActive" | "joinedAt">): MemberStatus {
  if (!m.isActive) return "inactive";
  return m.joinedAt ? "active" : "pending";
}

/** Members of one school (RLS limits this to schools the caller may see). */
export async function listMembers(schoolId: string): Promise<MemberRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, school_id, is_active, invited_at, joined_at")
    .eq("school_id", schoolId)
    .order("role")
    .order("full_name")
    .limit(500);

  if (error) {
    console.error("[db] listMembers:", error.code, error.message);
    return null;
  }
  return data.map((p) => ({
    id: p.id,
    fullName: p.full_name || p.email || "Tanpa nama",
    email: p.email,
    role: p.role,
    schoolId: p.school_id,
    isActive: p.is_active,
    invitedAt: p.invited_at,
    joinedAt: p.joined_at,
  }));
}
