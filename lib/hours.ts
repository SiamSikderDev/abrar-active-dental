import type { Appointment, HoursWindow, Service, Settings, WeekHours } from "./types";

/** All date/time logic runs in the clinic's timezone, Asia/Dhaka. */
export const TZ = "Asia/Dhaka";
export const SLOT_MIN = 30;
export const BOOK_AHEAD_DAYS = 30;

/** "HH:MM" -> minutes since midnight. Returns NaN for bad input. */
export function parseHHMM(s: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dhakaParts(d: Date): { y: number; mo: number; day: number; mins: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(parts.year),
    mo: Number(parts.month),
    day: Number(parts.day),
    mins: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: wdMap[parts.weekday] ?? 0,
  };
}

export function dhakaTodayStr(d = new Date()): string {
  const p = dhakaParts(d);
  return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function dhakaNowMinutes(d = new Date()): number {
  return dhakaParts(d).mins;
}

export function weekdayOf(dateStr: string): number {
  // Parse as UTC noon to avoid TZ shifts, then read the UTC weekday.
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.getUTCDay();
}

export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dateInRange(dateStr: string, now = new Date()): boolean {
  if (!isValidDateStr(dateStr)) return false;
  const today = dhakaTodayStr(now);
  return dateStr >= today && dateStr <= addDaysStr(today, BOOK_AHEAD_DAYS);
}

export function windowsFor(dateStr: string, hours: WeekHours): HoursWindow[] {
  return hours[String(weekdayOf(dateStr))] ?? [];
}

function minutesOverlap(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  return aStart < bStart + bDur && bStart < aStart + aDur;
}

/**
 * 30-minute start slots for a service on a date.
 * A start is offered only when every 30-min chunk of the service fits
 * inside one opening window, is in the future (for today), and does not
 * overlap any pending/confirmed appointment (one chair).
 */
export function generateSlots(
  dateStr: string,
  service: Service,
  settings: Settings,
  appointments: Appointment[],
  now = new Date()
): string[] {
  const windows = windowsFor(dateStr, settings.hours)
    .map((w) => ({ open: parseHHMM(w.open), close: parseHHMM(w.close) }))
    .filter((w) => Number.isFinite(w.open) && Number.isFinite(w.close) && w.close > w.open);
  if (windows.length === 0) return [];

  const chunks = Math.max(1, Math.ceil(service.durationMin / SLOT_MIN));
  const isToday = dateStr === dhakaTodayStr(now);
  const nowMins = dhakaNowMinutes(now);
  const booked = appointments.filter(
    (a) => a.date === dateStr && (a.status === "pending" || a.status === "confirmed")
  );

  const out: string[] = [];
  for (const w of windows) {
    for (let start = w.open; start + SLOT_MIN <= w.close; start += SLOT_MIN) {
      // Every chunk of the service must sit inside a single window.
      let fits = true;
      for (let c = 0; c < chunks; c++) {
        const cs = start + c * SLOT_MIN;
        if (cs + SLOT_MIN > w.close) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;
      if (isToday && start <= nowMins) continue;
      const blocked = booked.some((a) =>
        minutesOverlap(start, service.durationMin, parseHHMM(a.slot), a.durationMin)
      );
      if (blocked) continue;
      out.push(toHHMM(start));
    }
  }
  return out;
}

/** Loose Bangladesh mobile validation: 01XXXXXXXXX or +8801XXXXXXXXX. */
export function isValidBdPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-()]/g, "");
  return /^(\+880|880|0)1[3-9]\d{8}$/.test(digits);
}

export function normalizeBdPhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+880")) return digits.slice(1);
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits;
}
