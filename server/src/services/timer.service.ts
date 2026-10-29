import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';
import type { StartTimerInput } from '../validators/timer.validator';

/**
 * Защита от параллельных запусков в SQLite + Prisma.
 *
 * Ограничение SQLite: нет частичных индексов и CHECK-ограничений на основе других строк,
 * поэтому гарантировать уникальность активного таймера только схемой нельзя.
 * Решение: транзакция SERIALIZABLE (BEGIN IMMEDIATE в SQLite берёт блокировку записи сразу),
 * внутри которой проверяем наличие активной записи и создаём новую атомарно.
 * Второй параллельный запрос либо ждёт блокировки, либо падает с SQLITE_BUSY — оба случая
 * корректно обрабатываются ниже.
 */
async function withImmediateTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const maxAttempts = 5;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (err) {
      const isBusy =
        err instanceof Prisma.PrismaClientUnknownRequestError ||
        (err instanceof Error && /SQLITE_BUSY|database is locked/i.test(err.message));
      if (isBusy && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 20 * attempt));
        continue;
      }
      throw err;
    }
  }
}

export async function startTimer(input: StartTimerInput) {
  return withImmediateTransaction(async (tx) => {
    const employee = await tx.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee) throw AppError.notFound('Сотрудник не найден');
    if (employee.status !== 'active') throw AppError.conflict('Архивированный сотрудник не может запускать таймеры');

    const existing = await tx.timeEntry.findFirst({
      where: { employeeId: input.employeeId, endedAt: null },
    });
    if (existing) {
      throw AppError.conflict('У сотрудника уже есть активный таймер', { activeTimerId: existing.id });
    }

    return tx.timeEntry.create({
      data: {
        employeeId: input.employeeId,
        taskTitle: input.taskTitle.trim(),
        description: input.description?.trim() || null,
        startedAt: new Date(),
        endedAt: null,
        durationSeconds: null,
      },
    });
  });
}

export async function pauseTimer(id: string) {
  return withImmediateTransaction(async (tx) => {
    const entry = await tx.timeEntry.findUnique({ where: { id } });
    if (!entry) throw AppError.notFound('Запись не найдена');
    if (entry.endedAt !== null) throw AppError.conflict('Таймер уже остановлен', { endedAt: entry.endedAt });
    if (entry.pausedAt !== null) throw AppError.conflict('Таймер уже на паузе', { pausedAt: entry.pausedAt });

    const now = new Date();
    return tx.timeEntry.update({
      where: { id },
      data: { pausedAt: now },
    });
  });
}

export async function resumeTimer(id: string) {
  return withImmediateTransaction(async (tx) => {
    const entry = await tx.timeEntry.findUnique({ where: { id } });
    if (!entry) throw AppError.notFound('Запись не найдена');
    if (entry.endedAt !== null) throw AppError.conflict('Таймер уже остановлен', { endedAt: entry.endedAt });
    if (entry.pausedAt === null) throw AppError.conflict('Таймер не на паузе');

    const now = new Date();
    const pausedDuration = Math.floor((now.getTime() - entry.pausedAt.getTime()) / 1000);
    return tx.timeEntry.update({
      where: { id },
      data: {
        pausedAt: null,
        pausedSeconds: entry.pausedSeconds + pausedDuration,
      },
    });
  });
}

export async function stopTimer(id: string) {
  return withImmediateTransaction(async (tx) => {
    const entry = await tx.timeEntry.findUnique({ where: { id } });
    if (!entry) throw AppError.notFound('Запись не найдена');
    if (entry.endedAt !== null) throw AppError.conflict('Таймер уже остановлен', { endedAt: entry.endedAt });

    const now = new Date();
    let pausedSeconds = entry.pausedSeconds;
    if (entry.pausedAt !== null) {
      pausedSeconds += Math.floor((now.getTime() - entry.pausedAt.getTime()) / 1000);
    }
    const durationSeconds = Math.max(0, Math.floor((now.getTime() - entry.startedAt.getTime()) / 1000) - pausedSeconds);

    return tx.timeEntry.update({
      where: { id },
      data: { endedAt: now, durationSeconds, pausedAt: null, pausedSeconds },
    });
  });
}

export async function getActiveTimers(employeeId?: string) {
  const where: Prisma.TimeEntryWhereInput = { endedAt: null };
  if (employeeId) where.employeeId = employeeId;
  return prisma.timeEntry.findMany({
    where,
    include: { employee: true },
    orderBy: { startedAt: 'desc' },
  });
}

export async function hasActiveTimer(employeeId: string): Promise<boolean> {
  const found = await prisma.timeEntry.findFirst({
    where: { employeeId, endedAt: null },
    select: { id: true },
  });
  return !!found;
}

export async function countActiveTimers(): Promise<number> {
  return prisma.timeEntry.count({ where: { endedAt: null } });
}
