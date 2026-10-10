// Task 20, Phase 5: turns a trainer's weekly TrainerAvailability windows
// into concrete open time slots for one date, minus times already taken
// by an existing (non-cancelled) TrainingSession that day. Fixed
// 60-minute slots — see the TrainerAvailability model comment in
// prisma/schema.prisma for why this stays simple rather than a full
// calendar system.

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

export function computeOpenSlots(
  windows: { dayOfWeek: number; startTime: string; endTime: string }[],
  dateStr: string, // "YYYY-MM-DD"
  bookedTimes: string[] // ["09:00", "14:00", ...] already taken that date
): string[] {
  // Parsing "YYYY-MM-DD" as UTC avoids a timezone-shift-by-one-day bug
  // that plain `new Date(dateStr)` can hit depending on the server's
  // local timezone.
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return [];
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  const todaysWindows = windows.filter((w) => w.dayOfWeek === dayOfWeek);
  const booked = new Set(bookedTimes);
  const slots: string[] = [];

  for (const w of todaysWindows) {
    const start = timeToMinutes(w.startTime);
    const end = timeToMinutes(w.endTime);
    for (let t = start; t + 60 <= end; t += 60) {
      const slot = minutesToTime(t);
      if (!booked.has(slot)) slots.push(slot);
    }
  }

  return slots.sort();
}
