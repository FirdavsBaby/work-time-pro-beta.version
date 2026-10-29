import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  startOfDayUTC,
  endOfDayUTC,
  startOfWeekUTC,
  endOfWeekUTC,
  startOfMonthUTC,
  endOfMonthUTC,
  overlapSeconds,
  ymdUTC,
} from '../utils/time';
import type { ReportQuery } from '../validators/report.validator';

export interface ResolvedPeriod {
  from: Date;
  to: Date; // exclusive
}

export function resolvePeriod(q: Pick<ReportQuery, 'period' | 'from' | 'to'>, now = new Date()): ResolvedPeriod {
  switch (q.period) {
    case 'today':
      return { from: startOfDayUTC(now), to: endOfDayUTC(now) };
    case 'week':
      return { from: startOfWeekUTC(now), to: endOfWeekUTC(now) };
    case 'month':
      return { from: startOfMonthUTC(now), to: endOfMonthUTC(now) };
    case 'custom': {
      const from = q.from ? new Date(q.from) : startOfMonthUTC(now);
      // Пользователь указывает дату конца включительно → полуоткрытый интервал до конца суток
      const to = q.to ? endOfDayUTC(new Date(q.to)) : endOfDayUTC(now);
      return { from, to };
    }
  }
}

interface CompletedEntry {
  employeeId: string;
  taskTitle: string;
  description: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  employee?: { name: string } | null;
}

/**
 * Выбираем все завершённые записи, которые ПЕРЕСЕКАЮТ период [from, to):
 * запись началась до конца периода И закончилась после начала периода.
 * Это корректно обрабатывает записи, пересекающие границы периода.
 */
async function fetchCompletedInRange(period: ResolvedPeriod, employeeId?: string): Promise<CompletedEntry[]> {
  const filter: Prisma.TimeEntryWhereInput = {
    AND: [
      { endedAt: { not: null } },
      { startedAt: { lt: period.to } },
      { endedAt: { gte: period.from } },
    ],
  };
  if (employeeId) filter.employeeId = employeeId;
  return prisma.timeEntry.findMany({
    where: filter,
    include: { employee: { select: { name: true } } },
  });
}

export interface SummaryResult {
  totalSeconds: number;
  completedCount: number;
  averageSeconds: number;
  activeCount: number;
  period: { from: string; to: string };
}

export async function getSummary(q: ReportQuery, now = new Date()): Promise<SummaryResult> {
  const period = resolvePeriod(q, now);
  const entries = await fetchCompletedInRange(period, q.employeeId);

  let totalSeconds = 0;
  for (const e of entries) {
    if (!e.endedAt) continue;
    totalSeconds += overlapSeconds(e.startedAt, e.endedAt, period.from, period.to);
  }

  const activeCount = await prisma.timeEntry.count({
    where: {
      endedAt: null,
      ...(q.employeeId ? { employeeId: q.employeeId } : {}),
    },
  });

  return {
    totalSeconds,
    completedCount: entries.length,
    averageSeconds: entries.length > 0 ? Math.round(totalSeconds / entries.length) : 0,
    activeCount,
    period: { from: period.from.toISOString(), to: period.to.toISOString() },
  };
}

export interface EmployeeStat {
  employeeId: string;
  employeeName: string;
  totalSeconds: number;
  completedCount: number;
  averageSeconds: number;
}

export async function getEmployeesReport(q: ReportQuery, now = new Date()): Promise<EmployeeStat[]> {
  const period = resolvePeriod(q, now);
  const entries = await fetchCompletedInRange(period, q.employeeId);

  const map = new Map<string, { name: string; seconds: number; count: number }>();
  for (const e of entries) {
    if (!e.endedAt) continue;
    const sec = overlapSeconds(e.startedAt, e.endedAt, period.from, period.to);
    if (sec <= 0) continue;
    const bucket = map.get(e.employeeId) ?? { name: e.employee?.name ?? '', seconds: 0, count: 0 };
    bucket.seconds += sec;
    bucket.count += 1;
    map.set(e.employeeId, bucket);
  }

  return Array.from(map.entries())
    .map(([employeeId, v]) => ({
      employeeId,
      employeeName: v.name,
      totalSeconds: v.seconds,
      completedCount: v.count,
      averageSeconds: v.count > 0 ? Math.round(v.seconds / v.count) : 0,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD (UTC)
  totalSeconds: number;
  completedCount: number;
}

export async function getDailyReport(q: ReportQuery, now = new Date()): Promise<DailyPoint[]> {
  const period = resolvePeriod(q, now);
  const entries = await fetchCompletedInRange(period, q.employeeId);

  const days: DailyPoint[] = [];
  const dayIndex = new Map<string, DailyPoint>();
  const cursor = new Date(period.from);
  while (cursor < period.to) {
    const key = ymdUTC(cursor);
    const point: DailyPoint = { date: key, totalSeconds: 0, completedCount: 0 };
    days.push(point);
    dayIndex.set(key, point);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const e of entries) {
    if (!e.endedAt) continue;
    // Раскладываем запись по суткам UTC, чтобы точно учесть пересечения границ периода.
    const dayCursor = startOfDayUTC(e.startedAt);
    while (dayCursor < e.endedAt && dayCursor < period.to) {
      const dayEnd = endOfDayUTC(dayCursor);
      const segStart = dayCursor > e.startedAt ? dayCursor : e.startedAt;
      const segEnd = dayEnd < e.endedAt ? dayEnd : e.endedAt;
      const sec = overlapSeconds(segStart, segEnd, period.from, period.to);
      if (sec > 0) {
        const p = dayIndex.get(ymdUTC(dayCursor));
        if (p) p.totalSeconds += sec;
      }
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }
    // completedCount считаем один раз на запись, если она хоть частично в периоде
    const inPeriod = overlapSeconds(e.startedAt, e.endedAt, period.from, period.to);
    if (inPeriod > 0) {
      const interStart = new Date(Math.max(e.startedAt.getTime(), period.from.getTime()));
      const p = dayIndex.get(ymdUTC(interStart));
      if (p) p.completedCount += 1;
    }
  }

  return days;
}

export interface TaskBreakdownItem {
  taskTitle: string;
  totalSeconds: number;
  count: number;
}

export async function getTasksBreakdown(q: ReportQuery, now = new Date()): Promise<TaskBreakdownItem[]> {
  const period = resolvePeriod(q, now);
  const entries = await fetchCompletedInRange(period, q.employeeId);
  const map = new Map<string, TaskBreakdownItem>();
  for (const e of entries) {
    if (!e.endedAt) continue;
    const sec = overlapSeconds(e.startedAt, e.endedAt, period.from, period.to);
    if (sec <= 0) continue;
    const item = map.get(e.taskTitle) ?? { taskTitle: e.taskTitle, totalSeconds: 0, count: 0 };
    item.totalSeconds += sec;
    item.count += 1;
    map.set(e.taskTitle, item);
  }
  return Array.from(map.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
}

export interface CsvRow {
  employeeName: string;
  taskTitle: string;
  description: string;
  startDate: string;
  startTime: string;
  endTime: string;
  durationHMS: string;
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export async function getCsvRows(q: ReportQuery, now = new Date()): Promise<CsvRow[]> {
  const period = resolvePeriod(q, now);
  const entries = await fetchCompletedInRange(period, q.employeeId);
  const rows: CsvRow[] = [];
  for (const e of entries) {
    if (!e.endedAt) continue;
    const sec = overlapSeconds(e.startedAt, e.endedAt, period.from, period.to);
    if (sec <= 0) continue;
    rows.push({
      employeeName: e.employee?.name ?? '',
      taskTitle: e.taskTitle,
      description: e.description ?? '',
      startDate: e.startedAt.toISOString().slice(0, 10),
      startTime: e.startedAt.toISOString().slice(11, 19),
      endTime: e.endedAt.toISOString().slice(11, 19),
      durationHMS: formatHms(sec),
    });
  }
  return rows;
}

export interface DashboardStats {
  activeEmployees: number;
  todaySeconds: number;
  todayCompletedCount: number;
  activeTimersCount: number;
  last7Days: DailyPoint[];
  recentEntries: Array<{
    id: string;
    taskTitle: string;
    startedAt: Date;
    endedAt: Date | null;
    durationSeconds: number | null;
    employee: { id: string; name: string };
  }>;
  activeList: Array<{
    id: string;
    taskTitle: string;
    description: string | null;
    startedAt: Date;
    employee: { id: string; name: string };
  }>;
}

export async function getDashboardStats(now = new Date()): Promise<DashboardStats> {
  const todayFrom = startOfDayUTC(now);
  const todayTo = endOfDayUTC(now);
  const week7From = startOfDayUTC(new Date(now.getTime() - 6 * 24 * 3600 * 1000));

  const employeesPromise = prisma.employee.count({ where: { status: 'active' } });
  const activeTimersPromise = prisma.timeEntry.count({ where: { endedAt: null } });

  const todayEntriesPromise = prisma.timeEntry.findMany({
    where: {
      AND: [{ endedAt: { not: null } }, { endedAt: { gte: todayFrom } }, { endedAt: { lt: todayTo } }],
    },
    select: { startedAt: true, endedAt: true },
  });

  const last7DaysPromise = (async (): Promise<DailyPoint[]> => {
    const entries = await prisma.timeEntry.findMany({
      where: {
        AND: [{ endedAt: { not: null } }, { endedAt: { gte: week7From } }, { endedAt: { lt: todayTo } }],
      },
      select: { startedAt: true, endedAt: true },
    });
    const days: DailyPoint[] = [];
    const idx = new Map<string, DailyPoint>();
    const cur = new Date(week7From);
    while (cur < todayTo) {
      const k = ymdUTC(cur);
      const p: DailyPoint = { date: k, totalSeconds: 0, completedCount: 0 };
      days.push(p);
      idx.set(k, p);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    for (const e of entries) {
      if (!e.endedAt) continue;
      const sec = overlapSeconds(e.startedAt, e.endedAt, week7From, todayTo);
      if (sec <= 0) continue;
      const p = idx.get(ymdUTC(e.endedAt));
      if (p) {
        p.totalSeconds += sec;
        p.completedCount += 1;
      }
    }
    return days;
  })();

  const recentEntriesPromise = prisma.timeEntry.findMany({
    where: { endedAt: { not: null } },
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { endedAt: 'desc' },
    take: 10,
  });

  const activeListPromise = prisma.timeEntry.findMany({
    where: { endedAt: null },
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { startedAt: 'desc' },
  });

  const [employees, activeTimers, todayEntries, last7Days, recentEntries, activeList] = await Promise.all([
    employeesPromise,
    activeTimersPromise,
    todayEntriesPromise,
    last7DaysPromise,
    recentEntriesPromise,
    activeListPromise,
  ]);

  let todaySeconds = 0;
  for (const e of todayEntries) {
    if (!e.endedAt) continue;
    todaySeconds += overlapSeconds(e.startedAt, e.endedAt, todayFrom, todayTo);
  }

  return {
    activeEmployees: employees,
    todaySeconds,
    todayCompletedCount: todayEntries.length,
    activeTimersCount: activeTimers,
    last7Days,
    recentEntries,
    activeList,
  };
}
