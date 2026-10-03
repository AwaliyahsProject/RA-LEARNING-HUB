import { describe, expect, it } from "vitest";
import { signInErrorMessage, signInSchema } from "./schemas";

describe("signInSchema", () => {
  it("accepts and trims a valid email", () => {
    const result = signInSchema.safeParse({ email: "  guru@ra.sch.id ", password: "rahasia" });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("guru@ra.sch.id");
  });

  it("returns Indonesian messages for missing fields", () => {
    const result = signInSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    const errors = result.error!.flatten().fieldErrors;
    expect(errors.email?.[0]).toBe("Email wajib diisi.");
    expect(errors.password?.[0]).toBe("Kata sandi wajib diisi.");
  });

  it("rejects malformed emails", () => {
    const result = signInSchema.safeParse({ email: "bukan-email", password: "x" });
    expect(result.error!.flatten().fieldErrors.email?.[0]).toBe("Format email belum benar.");
  });
});

describe("signInErrorMessage", () => {
  it("never leaks unknown error codes", () => {
    expect(signInErrorMessage("some_internal_failure")).toMatch(/Tidak dapat masuk/);
    expect(signInErrorMessage(undefined)).toMatch(/Tidak dapat masuk/);
  });

  it("explains wrong credentials", () => {
    expect(signInErrorMessage("invalid_credentials")).toMatch(/tidak cocok/);
  });
});
