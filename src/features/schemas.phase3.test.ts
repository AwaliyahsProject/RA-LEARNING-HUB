import { describe, expect, it } from "vitest";
import { academicYearSchema, suggestAcademicYear } from "./academic-years/schemas";
import { classSchema } from "./classes/schemas";
import { detectImageType, schoolProfileSchema } from "./schools/schemas";

describe("academicYearSchema", () => {
  const ok = { name: "2026/2027", startDate: "2026-07-13", endDate: "2027-06-25" };
  it("accepts a normal year", () => {
    expect(academicYearSchema.safeParse(ok).success).toBe(true);
  });
  it("requires consecutive years and the 2026/2027 format", () => {
    expect(academicYearSchema.safeParse({ ...ok, name: "2026/2028" }).success).toBe(false);
    expect(academicYearSchema.safeParse({ ...ok, name: "2026-2027" }).success).toBe(false);
  });
  it("rejects end before start and overly long spans", () => {
    expect(academicYearSchema.safeParse({ ...ok, endDate: "2026-07-01" }).success).toBe(false);
    expect(academicYearSchema.safeParse({ ...ok, endDate: "2028-06-30" }).success).toBe(false);
  });
  it("suggests the year that contains today (July start)", () => {
    expect(suggestAcademicYear(new Date("2026-10-05")).name).toBe("2026/2027");
    expect(suggestAcademicYear(new Date("2027-03-01")).name).toBe("2026/2027");
    expect(suggestAcademicYear(new Date("2027-07-02")).name).toBe("2027/2028");
  });
});

describe("classSchema", () => {
  it("only allows level A or B", () => {
    const base = { academicYearId: "6f1c7c1e-4a0b-4c1f-9f50-0f8f2b3f6a11", name: "Kelompok A1" };
    expect(classSchema.safeParse({ ...base, level: "A" }).success).toBe(true);
    expect(classSchema.safeParse({ ...base, level: "C" }).success).toBe(false);
  });
});

describe("schoolProfileSchema", () => {
  const base = {
    name: "RA Al-Hikmah", nsm: "", npsn: "", regency: "", province: "", timezone: "Asia/Jakarta",
    address: "", village: "", district: "", phone: "", email: "",
  };
  it("accepts empty optional contact fields", () => {
    const d = schoolProfileSchema.parse(base);
    expect(d.phone).toBeNull();
    expect(d.email).toBeNull();
  });
  it("validates phone and email when given", () => {
    expect(schoolProfileSchema.safeParse({ ...base, phone: "0812-3456-7890" }).success).toBe(true);
    expect(schoolProfileSchema.safeParse({ ...base, phone: "telp<script>" }).success).toBe(false);
    expect(schoolProfileSchema.safeParse({ ...base, email: "ra@contoh" }).success).toBe(false);
  });
});

describe("detectImageType", () => {
  it("recognises PNG, JPEG and WebP by magic bytes", () => {
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("image/png");
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
  });
  it("rejects SVG/HTML disguised as images", () => {
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<!doctype html>"))).toBeNull();
  });
});
