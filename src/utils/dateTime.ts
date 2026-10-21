/**
 * Utility functions for validating dates and time slots to prevent past selection.
 */

/**
 * Checks if an ISO date string (YYYY-MM-DD) is before today.
 */
export function isPastDate(dateISO: string | null | undefined): boolean {
  if (!dateISO) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateISO.split("-").map((v) => parseInt(v, 10));
  if (parts.length < 3 || parts.some(isNaN)) return false;
  const [year, month, day] = parts;

  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);

  return target < today;
}

/**
 * Checks if a 12-hour time slot string (e.g. "09:00 AM", "02:30 PM") or 24h format
 * is in the past for the given target date (YYYY-MM-DD).
 */
export function isPastTime(
  timeStr: string | null | undefined,
  dateISO: string | null | undefined
): boolean {
  if (!timeStr) return false;

  const effectiveDate = dateISO || new Date().toISOString().split("T")[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = effectiveDate.split("-").map((v) => parseInt(v, 10));
  if (parts.length < 3 || parts.some(isNaN)) return false;
  const [year, month, day] = parts;

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  // If date is before today -> entire time is past
  if (targetDate < today) return true;

  // If date is in the future -> time is not past
  if (targetDate > today) return false;

  // Date is TODAY -> compare time against current local time
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return false;

  let [_, h, m, period] = match;
  let hour = parseInt(h, 10);
  const minute = parseInt(m, 10);

  if (period) {
    period = period.toUpperCase();
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
  }

  const slotTime = new Date();
  slotTime.setHours(hour, minute, 0, 0);

  const now = new Date();
  // Slot start time at or before current time is considered past
  return slotTime <= now;
}

/**
 * Formats duration in minutes.
 * If >= 60 minutes, calculates and shows in hours also (e.g. "90 mins (1.5 hrs)", "60 mins (1 hr)").
 */
export function formatDuration(duration: number | string | undefined | null): string {
  if (duration === undefined || duration === null || duration === "") return "45 mins";
  let num: number;
  if (typeof duration === "number") {
    num = duration;
  } else {
    const str = String(duration).trim().toLowerCase();
    const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/);
    const minMatch = str.match(/(\d+)\s*(?:mins?|minutes?)/);
    if (hrMatch && minMatch) {
      num = Math.round(parseFloat(hrMatch[1]) * 60 + parseInt(minMatch[1], 10));
    } else if (hrMatch) {
      num = Math.round(parseFloat(hrMatch[1]) * 60);
    } else {
      const parsed = parseInt(str.replace(/\D+/g, ""), 10);
      num = !isNaN(parsed) && parsed > 0 ? parsed : 45;
    }
  }

  if (num < 60) {
    return `${num} mins`;
  }

  const hrs = num / 60;
  if (Number.isInteger(hrs)) {
    return `${num} mins (${hrs} ${hrs === 1 ? "hr" : "hrs"})`;
  }
  const remMins = num % 60;
  if (remMins === 30) {
    return `${num} mins (${hrs.toFixed(1)} hrs)`;
  }
  const wholeHrs = Math.floor(hrs);
  const hrPart = wholeHrs === 1 ? "1 hr" : `${wholeHrs} hrs`;
  return `${num} mins (${hrPart} ${remMins} mins)`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into DD-MM-YYYY format.
 * e.g., "2026-10-20" -> "20-10-2026"
 */
export function formatDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.trim();
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr || "";
}

/**
 * Formats date and time into "DD-MM-YYYY hh:mm A" (e.g. "20-10-2026 09:00 AM").
 */
export function formatScheduleDateTime(dateStr?: string | null, timeStr?: string | null): string {
  const formattedDate = formatDDMMYYYY(dateStr);
  if (!formattedDate && !timeStr) return "";
  if (formattedDate && timeStr) return `${formattedDate} ${timeStr}`;
  return formattedDate || timeStr || "";
}
