import { describe, expect, it } from "vitest";
import { HOME_PATH, isPublicPath, safeRedirectPath } from "./routes";

describe("safeRedirectPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeRedirectPath("/anak/asesmen")).toBe("/anak/asesmen");
    expect(safeRedirectPath("/pembelajaran/rpph?tanggal=2026-10-03")).toBe("/pembelajaran/rpph?tanggal=2026-10-03");
  });

  it.each([undefined, null, "", "dashboard", "https://evil.example", "//evil.example", "/\\evil.example", 42])(
    "falls back to the dashboard for %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe(HOME_PATH);
    },
  );
});

describe("isPublicPath", () => {
  it("allows login, forgot-password and auth callbacks only", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/lupa-sandi")).toBe(true);
    expect(isPublicPath("/atur-sandi")).toBe(false);
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/loginx")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });
});
