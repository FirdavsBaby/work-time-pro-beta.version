import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

export function makePrisma(): PrismaClient {
  return new PrismaClient();
}

export function makeApp() {
  return createApp();
}

export async function resetDb(prisma: PrismaClient): Promise<void> {
  await prisma.timeEntry.deleteMany();
  await prisma.employee.deleteMany();
}
