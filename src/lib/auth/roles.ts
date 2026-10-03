import type { UserRole } from "@/types/database";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  school_admin: "Kepala Sekolah / Admin",
  teacher: "Guru",
};

export function hasRole(role: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(role);
}
