/** Hour of day (0–23) in the given IANA timezone. */
export function hourInTimeZone(timeZone: string, date: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(date);
  return Number(hour);
}

export function greetingForHour(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

/** e.g. "Sabtu, 3 Oktober 2026" */
export function formatLongDate(timeZone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}
