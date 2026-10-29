import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, 'Имя обязательно').max(200),
  position: z.string().trim().min(1, 'Должность обязательна').max(200),
  email: z.union([
    z.literal(''),
    z.string().trim().email('Некорректный формат email').max(254),
  ]).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Нет полей для обновления' },
);

export const listEmployeesQuerySchema = z.object({
  status: z.enum(['active', 'archived']).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
