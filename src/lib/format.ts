export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function daysBetween(start: string | Date, end: string | Date = new Date()): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Number of calendar-day boundaries crossed between two dates (ignores time of day).
export function calendarDaysBetween(start: string | Date, end: string | Date): number {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY);
}

// One entry per calendar day from `start` to `end`, inclusive.
export function enumerateDays(start: string | Date, end: string | Date): Date[] {
  const startDate = startOfDay(start);
  const count = Math.max(0, calendarDaysBetween(start, end));
  return Array.from({ length: count + 1 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatShortDayMonth(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function isWeekend(value: string | Date): boolean {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = date.getDay();
  return day === 0 || day === 6;
}

// One entry per business day (Mon–Fri) from `start` to `end`, inclusive. Weekends
// are dropped entirely from the Research & Setup timeline grid.
export function enumerateBusinessDays(start: string | Date, end: string | Date): Date[] {
  return enumerateDays(start, end).filter((d) => !isWeekend(d));
}

// Index of the latest business day in `days` that is <= `date`. If `date` itself
// falls on a weekend, this snaps backward to the preceding Friday — used for
// exclusive segment-end boundaries (see businessDayIndexAtOrAfter for starts).
export function businessDayIndexAtOrBefore(days: Date[], date: string | Date): number {
  const target = startOfDay(date).getTime();
  let idx = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i].getTime() <= target) idx = i;
    else break;
  }
  return idx;
}

// Index of the earliest business day in `days` that is >= `date`. If `date` falls
// on a weekend, this snaps forward to the following Monday — used for segment starts.
export function businessDayIndexAtOrAfter(days: Date[], date: string | Date): number {
  const target = startOfDay(date).getTime();
  for (let i = 0; i < days.length; i++) {
    if (days[i].getTime() >= target) return i;
  }
  return Math.max(0, days.length - 1);
}
