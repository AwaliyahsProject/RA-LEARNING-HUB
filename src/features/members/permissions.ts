import type { UserRole } from "@/types/database";

/**
 * Pure authorization rules for member management. These mirror (and never
 * replace) the database rules in RLS + profiles_guard_update; they exist so
 * server actions can reject early with a clear message and so the UI only
 * offers actions that will succeed.
 */
export type Actor = { id: string; role: UserRole; schoolId: string | null; isActive: boolean };
export type Member = { id: string; role: UserRole; schoolId: string | null };

const INVITABLE: Record<UserRole, readonly UserRole[]> = {
  super_admin: ["school_admin", "teacher"],
  school_admin: ["teacher", "school_admin"],
  teacher: [],
};

export function invitableRoles(actor: Actor): readonly UserRole[] {
  return actor.isActive ? INVITABLE[actor.role] : [];
}

export function canInvite(actor: Actor, schoolId: string, role: UserRole): boolean {
  if (!invitableRoles(actor).includes(role)) return false;
  if (actor.role === "super_admin") return true;
  return actor.schoolId !== null && actor.schoolId === schoolId;
}

/** Resend invitation, activate/deactivate. Nobody manages themselves or a super admin. */
export function canManageMember(actor: Actor, member: Member): boolean {
  if (!actor.isActive || actor.id === member.id || member.role === "super_admin") return false;
  if (actor.role === "super_admin") return true;
  return actor.role === "school_admin" && actor.schoolId !== null && actor.schoolId === member.schoolId;
}
