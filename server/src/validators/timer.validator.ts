import { z } from 'zod';

export const startTimerSchema = z.object({
  employeeId: z.string().uuid('Некорректный ID сотрудника'),
  taskTitle: z.string().trim().min(1, 'Название задачи обязательно').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const activeTimersQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
});

export type StartTimerInput = z.infer<typeof startTimerSchema>;
