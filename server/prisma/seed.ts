import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMPLOYEES = [
  { name: 'Анна Петрова', position: 'Frontend-разработчик', email: 'anna.petrova@example.com' },
  { name: 'Иван Смирнов', position: 'Backend-разработчик', email: 'ivan.smirnov@example.com' },
  { name: 'Мария Кузнецова', position: 'UI/UX дизайнер', email: 'maria.kuznetsova@example.com' },
  { name: 'Дмитрий Волков', position: 'QA-инженер', email: 'dmitry.volkov@example.com' },
  { name: 'Елена Соколова', position: 'Project-менеджер', email: 'elena.sokolova@example.com' },
];

const TASKS = [
  'Разработка нового модуля',
  'Code review',
  'Написание тестов',
  'Планирование спринта',
  'Исправление багов',
  'Документация API',
  'Дизайн макетов',
  'Регрессионное тестирование',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main(): Promise<void> {
  // Идемпотентность: пропускаем сотрудников, которые уже есть по email.
  const employeeIds: string[] = [];
  for (const emp of EMPLOYEES) {
    const existing = await prisma.employee.findUnique({ where: { email: emp.email } });
    if (existing) {
      employeeIds.push(existing.id);
      continue;
    }
    const created = await prisma.employee.create({
      data: { ...emp, status: 'active' },
    });
    employeeIds.push(created.id);
  }

  // Создаём примеры завершённых записей за последние 14 дней, если история ещё пуста.
  const now = Date.now();
  const since = new Date(now - 14 * 24 * 3600 * 1000);
  const existingCount = await prisma.timeEntry.count({ where: { startedAt: { gte: since } } });
  if (existingCount > 0) {
    // eslint-disable-next-line no-console
    console.log('Seed: история времени уже существует, пропускаем создание записей.');
    return;
  }

  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const dayBase = now - dayOffset * 24 * 3600 * 1000;
    for (const employeeId of employeeIds) {
      // 1–3 записи на сотрудника в день
      const entriesPerDay = randomInt(1, 3);
      let cursor = dayBase - randomInt(1, 4) * 3600 * 1000; // старт где-то в течение дня
      for (let i = 0; i < entriesPerDay; i += 1) {
        const durationSeconds = randomInt(30 * 60, 4 * 3600); // 30 мин – 4 часа
        const startedAt = new Date(cursor);
        const endedAt = new Date(cursor + durationSeconds * 1000);
        cursor = endedAt.getTime() + randomInt(5, 60) * 60 * 1000; // перерыв между задачами
        await prisma.timeEntry.create({
          data: {
            employeeId,
            taskTitle: TASKS[randomInt(0, TASKS.length - 1)],
            description: null,
            startedAt,
            endedAt,
            durationSeconds,
          },
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seed: создано ${EMPLOYEES.length} сотрудников и примеры записей за 14 дней.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
