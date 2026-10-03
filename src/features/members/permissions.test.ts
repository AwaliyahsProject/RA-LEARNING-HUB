import { describe, expect, it } from "vitest";
import { canInvite, canManageMember, invitableRoles, type Actor } from "./permissions";

const A = "school-a";
const B = "school-b";
const superAdmin: Actor = { id: "s", role: "super_admin", schoolId: null, isActive: true };
const adminA: Actor = { id: "a", role: "school_admin", schoolId: A, isActive: true };
const teacherA: Actor = { id: "t", role: "teacher", schoolId: A, isActive: true };

describe("invitableRoles / canInvite", () => {
  it("super admin can invite school admins and teachers anywhere", () => {
    expect(canInvite(superAdmin, B, "school_admin")).toBe(true);
    expect(canInvite(superAdmin, A, "teacher")).toBe(true);
  });
  it("nobody can invite a super admin", () => {
    expect(canInvite(superAdmin, A, "super_admin")).toBe(false);
    expect(canInvite(adminA, A, "super_admin")).toBe(false);
  });
  it("school admin invites only into own school", () => {
    expect(canInvite(adminA, A, "teacher")).toBe(true);
    expect(canInvite(adminA, B, "teacher")).toBe(false);
  });
  it("teachers and inactive admins cannot invite", () => {
    expect(invitableRoles(teacherA)).toEqual([]);
    expect(canInvite({ ...adminA, isActive: false }, A, "teacher")).toBe(false);
  });
});

describe("canManageMember", () => {
  it("school admin manages members of own school only", () => {
    expect(canManageMember(adminA, { id: "x", role: "teacher", schoolId: A })).toBe(true);
    expect(canManageMember(adminA, { id: "y", role: "teacher", schoolId: B })).toBe(false);
  });
  it("never self, never a super admin", () => {
    expect(canManageMember(adminA, { id: "a", role: "school_admin", schoolId: A })).toBe(false);
    expect(canManageMember(adminA, { id: "s", role: "super_admin", schoolId: null })).toBe(false);
    expect(canManageMember(superAdmin, { id: "s2", role: "super_admin", schoolId: null })).toBe(false);
  });
  it("teachers manage nobody", () => {
    expect(canManageMember(teacherA, { id: "x", role: "teacher", schoolId: A })).toBe(false);
  });
});
