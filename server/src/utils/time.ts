/**
 * Единые правила работы со временем.
 * Все времена хранятся в UTC. Календарные периоды строятся как полуоткрытые интервалы [from, to).
 */

export function parseIsoDate(input: string | undefined | null): Date | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfDayUTC(date: Date): Date {
  // Полуоткрытый интервал: конец = начало следующего дня
  const d = startOfDayUTC(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export function startOfWeekUTC(date: Date): Date {
  // ISO неделя начинается с понедельника
  const d = startOfDayUTC(date);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function endOfWeekUTC(date: Date): Date {
  const d = startOfWeekUTC(date);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

export function startOfMonthUTC(date: Date): Date {
  const d = startOfDayUTC(date);
  d.setUTCDate(1);
  return d;
}

export function endOfMonthUTC(date: Date): Date {
  const d = startOfMonthUTC(date);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

/**
 * Пересечение интервала записи [entryStart, entryEnd] с периодом [periodStart, periodEnd).
 * Возвращает длительность пересечения в секундах (0 если нет пересечения).
 */
export function overlapSeconds(
  entryStart: Date,
  entryEnd: Date,
  periodStart: Date,
  periodEnd: Date,
): number {
  const s = Math.max(entryStart.getTime(), periodStart.getTime());
  const e = Math.min(entryEnd.getTime(), periodEnd.getTime());
  if (e <= s) return 0;
  return Math.floor((e - s) / 1000);
}

export function formatDurationHMS(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ymdUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}
