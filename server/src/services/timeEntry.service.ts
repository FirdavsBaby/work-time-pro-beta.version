import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { parseIsoDate, endOfDayUTC } from '../utils/time';
import type { TimeEntriesQuery } from '../validators/report.validator';

export async function listTimeEntries(query: TimeEntriesQuery) {
  const where: Prisma.TimeEntryWhereInput = {};

  if (query.employeeId) where.employeeId = query.employeeId;

  if (query.status === 'active') {
    where.endedAt = null;
  } else if (query.status === 'completed') {
    where.endedAt = { not: null };
  }

  if (query.from || query.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) {
      const f = parseIsoDate(query.from);
      if (f) dateFilter.gte = f;
    }
    if (query.to) {
      const t = parseIsoDate(query.to);
      if (t) dateFilter.lt = endOfDayUTC(t); // полуоткрытый интервал
    }
    where.startedAt = dateFilter;
  }

  if (query.search && query.search.trim()) {
    where.taskTitle = { contains: query.search.trim() };
  }

  const orderBy: Prisma.TimeEntryOrderByWithRelationInput = {
    [query.sortBy]: query.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: { employee: { select: { id: true, name: true, position: true } } },
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.timeEntry.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getTimeEntryById(id: string) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    include: { employee: true },
  });
  return entry;
}
