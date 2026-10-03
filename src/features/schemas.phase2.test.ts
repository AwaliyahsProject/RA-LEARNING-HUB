import { describe, expect, it } from "vitest";
import { inviteMemberSchema } from "./members/schemas";
import { createSchoolSchema } from "./schools/schemas";
import { newPasswordSchema } from "./profile/schemas";

describe("inviteMemberSchema", () => {
  const base = { schoolId: "6f1c7c1e-4a0b-4c1f-9f50-0f8f2b3f6a11", fullName: "Siti", email: " Guru@RA.id ", role: "teacher" };
  it("normalises email", () => {
    expect(inviteMemberSchema.parse(base).email).toBe("guru@ra.id");
  });
  it("rejects super_admin role", () => {
    expect(inviteMemberSchema.safeParse({ ...base, role: "super_admin" }).success).toBe(false);
  });
});

describe("createSchoolSchema", () => {
  const base = { name: "RA Al-Hikmah", nsm: "", npsn: "", regency: "", province: "", timezone: "Asia/Jakarta" };
  it("turns empty optional fields into null", () => {
    const d = createSchoolSchema.parse(base);
    expect(d.nsm).toBeNull();
    expect(d.regency).toBeNull();
  });
  it("validates NSM / NPSN digits", () => {
    const r = createSchoolSchema.safeParse({ ...base, nsm: "123", npsn: "12a45678" });
    expect(r.success).toBe(false);
    expect(createSchoolSchema.safeParse({ ...base, nsm: "101235780001", npsn: "69912345" }).success).toBe(true);
  });
});

describe("newPasswordSchema", () => {
  it("requires letters, digits, 8+ chars and matching confirmation", () => {
    expect(newPasswordSchema.safeParse({ password: "abcdefgh", confirm: "abcdefgh" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "abc12345", confirm: "abc12346" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "abc12345", confirm: "abc12345" }).success).toBe(true);
  });
});
