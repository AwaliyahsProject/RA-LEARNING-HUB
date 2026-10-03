import { describe, expect, it } from "vitest";
import { formatLongDate, greetingForHour, hourInTimeZone } from "./datetime";

describe("datetime", () => {
  const instant = new Date("2026-10-03T01:30:00Z"); // 08:30 WIB, 09:30 WITA, 10:30 WIT

  it("reads the hour in each Indonesian timezone", () => {
    expect(hourInTimeZone("Asia/Jakarta", instant)).toBe(8);
    expect(hourInTimeZone("Asia/Makassar", instant)).toBe(9);
    expect(hourInTimeZone("Asia/Jayapura", instant)).toBe(10);
  });

  it("maps hours to greetings", () => {
    expect(greetingForHour(0)).toBe("Selamat pagi");
    expect(greetingForHour(10)).toBe("Selamat pagi");
    expect(greetingForHour(11)).toBe("Selamat siang");
    expect(greetingForHour(15)).toBe("Selamat sore");
    expect(greetingForHour(18)).toBe("Selamat malam");
  });

  it("formats a long Indonesian date using the school timezone", () => {
    expect(formatLongDate("Asia/Jakarta", new Date("2026-10-03T18:00:00Z"))).toBe("Minggu, 4 Oktober 2026");
  });
});
