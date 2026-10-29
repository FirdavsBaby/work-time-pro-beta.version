import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';
import type { CreateEmployeeInput, UpdateEmployeeInput, ListEmployeesQuery } from '../validators/employee.validator';

function normalizeEmail(email?: string): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listEmployees(query: ListEmployeesQuery) {
  const where: Prisma.EmployeeWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { name: { contains: s } },
      { email: { contains: s.toLowerCase() } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.employee.count({ where }),
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

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw AppError.notFound('Сотрудник не найден');
  return employee;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const email = normalizeEmail(input.email);
  try {
    return await prisma.employee.create({
      data: {
        name: input.name.trim(),
        position: input.position.trim(),
        email,
        status: 'active',
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict('Сотрудник с таким email уже существует', { email });
    }
    throw err;
  }
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  await getEmployeeById(id);
  const data: Prisma.EmployeeUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.position !== undefined) data.position = input.position.trim();
  if (input.email !== undefined) data.email = normalizeEmail(input.email);

  try {
    return await prisma.employee.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict('Сотрудник с таким email уже существует', { email: input.email });
    }
    throw err;
  }
}

export async function archiveEmployee(id: string) {
  const employee = await getEmployeeById(id);
  // Архивирование не удаляет историю времени — записи остаются.
  return prisma.employee.update({
    where: { id: employee.id },
    data: { status: 'archived' },
  });
}

export async function countActiveEmployees(): Promise<number> {
  return prisma.employee.count({ where: { status: 'active' } });
}
