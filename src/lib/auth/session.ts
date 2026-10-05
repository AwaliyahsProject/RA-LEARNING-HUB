import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME_PATH, LOGIN_PATH } from "@/config/routes";
import { hasRole } from "@/lib/auth/roles";
import { isSchoolTimezone, type SchoolTimezone, type UserRole } from "@/types/database";

const DEFAULT_TIMEZONE: SchoolTimezone = "Asia/Jakarta";

/**
 * Data Access Layer for the current user. Every page and server action that
 * touches private data must go through `requireProfile()` / `requireRole()`.
 * Results are memoised per request with React `cache`.
 */
export type CurrentProfile = {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  schoolId: string | null;
  schoolName: string | null;
  /** Path in the `school-logos` bucket (see features/schools/storage.ts). */
  schoolLogoPath: string | null;
  /** School timezone (WIB/WITA/WIT); platform default for super admins. */
  timezone: SchoolTimezone;
  isActive: boolean;
};

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, school_id, is_active, schools(name, timezone, logo_url)")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    fullName: data.full_name || data.email || "Pengguna",
    email: data.email,
    role: data.role,
    schoolId: data.school_id,
    schoolName: data.schools?.name ?? null,
    schoolLogoPath: data.schools?.logo_url ?? null,
    timezone: isSchoolTimezone(data.schools?.timezone) ? data.schools.timezone : DEFAULT_TIMEZONE,
    isActive: data.is_active,
  };
});

/** Redirects to login when signed out. */
export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(LOGIN_PATH);
  return profile;
}

/** Redirects to the dashboard when the user lacks one of the allowed roles. */
export async function requireRole(allowed: readonly UserRole[]): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!profile.isActive || !hasRole(profile.role, allowed)) redirect(HOME_PATH);
  return profile;
}

/**
 * A non-super-admin must be active and attached to a school to use the app.
 * Super admins are platform-level and have no school.
 */
export function canAccessApp(profile: CurrentProfile): boolean {
  if (!profile.isActive) return false;
  return profile.role === "super_admin" || profile.schoolId !== null;
}

/** Shape used by pure permission checks (src/features/members/permissions.ts). */
export function toActor(profile: CurrentProfile) {
  return { id: profile.id, role: profile.role, schoolId: profile.schoolId, isActive: profile.isActive };
}
