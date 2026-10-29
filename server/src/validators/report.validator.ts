import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, 'Некорректный формат даты');

export const periodEnum = z.enum(['today', 'week', 'month', 'custom']);

export const reportQuerySchema = z
  .object({
    period: periodEnum.default('month'),
    from: isoDate.optional(),
    to: isoDate.optional(),
    employeeId: z.string().uuid().optional(),
  })
  .refine((data) => data.period !== 'custom' || (!!data.from && !!data.to), {
    message: 'Для произвольного периода нужны from и to',
    path: ['from'],
  });

export const timeEntriesQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  search: z.string().trim().max(200).optional(),
  status: z.enum(['active', 'completed', 'all']).default('all'),
  sortBy: z.enum(['startedAt', 'endedAt', 'durationSeconds']).default('startedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type TimeEntriesQuery = z.infer<typeof timeEntriesQuerySchema>;
