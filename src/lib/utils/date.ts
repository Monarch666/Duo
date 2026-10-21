/**
 * Date and Time utilities for Duo
 */

/**
 * Compute the ISO-8601 week number and year for any given Date.
 * Follows the standard ISO week-date specification:
 * - Weeks start on Monday
 * - Week 1 is the first week containing Thursday (or containing Jan 4)
 */
export function getISOWeekAndYear(d: Date = new Date()): { year: number; weekNumber: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), weekNumber };
}
