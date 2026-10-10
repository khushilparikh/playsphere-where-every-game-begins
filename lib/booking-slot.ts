// Shared date/slot formatting for venue bookings — used by both the
// booking creation route and the recurring-booking generator (Task 25,
// Phase 6) so every Booking.slot string is built exactly the same way,
// which the slot-conflict check (Task 4, Phase 2) and the availability
// lookup (Task 19, Phase 5) both depend on matching consistently.

export function formatSlot(dateISO: string, time: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const datePart = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return `${datePart}, ${time}`;
}

export function addWeeksToDate(dateISO: string, weeks: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + weeks * 7));
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Parses a slot string like "Sun, 22 Sep, 17:00" or "Sun, 22 Sep, 17:00-18:30"
export function parseSlotTimeRange(slotStr: string) {
  const parts = slotStr.split(", ");
  const timePart = parts[parts.length - 1]; // "17:00" or "17:00-18:30"
  const datePart = parts.slice(0, parts.length - 1).join(", ");

  let startStr = timePart;
  let endStr = "";

  if (timePart.includes("-")) {
    [startStr, endStr] = timePart.split("-");
  } else {
    // Default to 1 hour duration if no end time provided
    const [h, m] = startStr.split(":").map(Number);
    endStr = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const parseMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  return {
    datePart,
    startMinutes: parseMinutes(startStr.trim()),
    endMinutes: parseMinutes(endStr.trim())
  };
}

export function calculateSlotDurationAndAmount(slotStr: string, pricePerHour: number) {
  const { startMinutes, endMinutes } = parseSlotTimeRange(slotStr);
  
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes <= 0) {
    // Handle overnight slots (e.g. 23:00 to 01:00)
    durationMinutes += 24 * 60;
  }
  
  const durationInHours = durationMinutes / 60;
  const totalAmount = Math.round(durationInHours * pricePerHour);

  return { durationInHours, totalAmount };
}

export function doSlotsOverlap(slotA: string, slotB: string): boolean {
  const a = parseSlotTimeRange(slotA);
  const b = parseSlotTimeRange(slotB);

  // If they are on different dates, they don't overlap
  if (a.datePart !== b.datePart) return false;

  // Overlap condition: startA < endB AND startB < endA
  return (a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes);
}
