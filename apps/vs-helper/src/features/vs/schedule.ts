export interface ScheduleConfig {
  timesPerDay: number; // e.g. 20
  firstTime: string; // "HH:mm" e.g. "07:00"
  lastTime: string; // "HH:mm" e.g. "22:00"
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toHHMM(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Returns "HH:mm" slots evenly spaced from firstTime..lastTime (inclusive), so
 * the day's practices are distributed throughout the first–last window.
 * Spacing: with n times inclusive, the interval is (last - first) / (n - 1).
 */
export function computeSlots(config: ScheduleConfig): string[] {
  const n = Math.max(1, Math.floor(config.timesPerDay));
  const start = toMinutes(config.firstTime);
  const end = toMinutes(config.lastTime);

  if (n === 1 || end <= start) return [toHHMM(start)];

  const interval = (end - start) / (n - 1);
  const slots: string[] = [];
  for (let i = 0; i < n; i++) slots.push(toHHMM(start + interval * i));
  return slots;
}

// Given the slots and the current time, return the next upcoming slot (or null).
export function nextSlot(slots: string[], now: Date): string | null {
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const s of slots) {
    if (toMinutes(s) > cur) return s;
  }
  return null;
}
