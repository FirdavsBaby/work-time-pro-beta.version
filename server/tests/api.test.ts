import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { makeApp, makePrisma, resetDb } from './helpers';

let prisma: PrismaClient;
let app: ReturnType<typeof makeApp>;

beforeAll(() => {
  prisma = makePrisma();
  app = makeApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb(prisma);
});

async function createEmployee(overrides: Partial<{ name: string; position: string; email: string }> = {}) {
  const res = await request(app)
    .post('/api/employees')
    .send({
      name: overrides.name ?? 'Тестовый Сотрудник',
      position: overrides.position ?? 'Разработчик',
      email: overrides.email ?? `emp-${Math.random().toString(36).slice(2)}@example.com`,
    });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

describe('Health', () => {
  it('GET /api/health возвращает ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.database).toBe(true);
  });
});

describe('Employees CRUD', () => {
  it('создаёт сотрудника и отдаёт в списке', async () => {
    const created = await createEmployee({ name: 'Анна Тестова' });
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((e: { id: string }) => e.id === created.id)).toBe(true);
  });

  it('валидация: пустое имя → 400', async () => {
    const res = await request(app).post('/api/employees').send({ name: '', position: 'Dev' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('валидация: некорректный email → 400', async () => {
    const res = await request(app).post('/api/employees').send({ name: 'X', position: 'Dev', email: 'not-email' });
    expect(res.status).toBe(400);
  });

  it('дубликат email → 409', async () => {
    await createEmployee({ email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/employees')
      .send({ name: 'Y', position: 'Dev', email: 'dup@example.com' });
    expect(res.status).toBe(409);
  });

  it('PATCH обновляет данные', async () => {
    const emp = await createEmployee({ name: 'Старое Имя' });
    const res = await request(app).patch(`/api/employees/${emp.id}`).send({ name: 'Новое Имя' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Новое Имя');
  });

  it('archive переводит статус в archived, история сохраняется', async () => {
    const emp = await createEmployee();
    await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'Задача' }).expect(201);
    const active = await request(app).get('/api/timers/active');
    await request(app).post(`/api/timers/${active.body.data[0].id}/stop`).expect(200);

    const arch = await request(app).patch(`/api/employees/${emp.id}/archive`);
    expect(arch.status).toBe(200);
    expect(arch.body.data.status).toBe('archived');

    const entries = await request(app).get(`/api/time-entries?employeeId=${emp.id}`);
    expect(entries.body.data.pagination.total).toBe(1);
  });

  it('404 для несуществующего сотрудника', async () => {
    const res = await request(app).get('/api/employees/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('Timers', () => {
  it('запускает таймер и сохраняет активную запись', async () => {
    const emp = await createEmployee();
    const res = await request(app)
      .post('/api/timers/start')
      .send({ employeeId: emp.id, taskTitle: 'Работа', description: 'описание' });
    expect(res.status).toBe(201);
    expect(res.body.data.endedAt).toBeNull();
    expect(res.body.data.durationSeconds).toBeNull();

    const active = await request(app).get('/api/timers/active');
    expect(active.body.data.length).toBe(1);
  });

  it('повторный запуск для того же сотрудника → 409', async () => {
    const emp = await createEmployee();
    await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'Первая' }).expect(201);
    const res = await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'Вторая' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('два параллельных запроса запуска → ровно один активный таймер', async () => {
    const emp = await createEmployee();
    const [r1, r2] = await Promise.all([
      request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'A' }),
      request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'B' }),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 409]);
    const active = await request(app).get('/api/timers/active');
    expect(active.body.data.length).toBe(1);
  });

  it('останавливает таймер, сохраняет положительную длительность', async () => {
    const emp = await createEmployee();
    const start = await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'Задача' });
    // Небольшая пауза, чтобы duration > 0
    await new Promise((r) => setTimeout(r, 1100));
    const stop = await request(app).post(`/api/timers/${start.body.data.id}/stop`);
    expect(stop.status).toBe(200);
    expect(stop.body.data.endedAt).not.toBeNull();
    expect(stop.body.data.durationSeconds).toBeGreaterThanOrEqual(1);
  });

  it('повторная остановка → 409', async () => {
    const emp = await createEmployee();
    const start = await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'Задача' });
    await request(app).post(`/api/timers/${start.body.data.id}/stop`).expect(200);
    const again = await request(app).post(`/api/timers/${start.body.data.id}/stop`);
    expect(again.status).toBe(409);
  });

  it('запуск для несуществующего сотрудника → 404', async () => {
    const res = await request(app)
      .post('/api/timers/start')
      .send({ employeeId: '00000000-0000-0000-0000-000000000000', taskTitle: 'X' });
    expect(res.status).toBe(404);
  });

  it('запуск для архивированного сотрудника → 409', async () => {
    const emp = await createEmployee();
    await request(app).patch(`/api/employees/${emp.id}/archive`).expect(200);
    const res = await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'X' });
    expect(res.status).toBe(409);
  });

  it('некорректное тело запроса → 400', async () => {
    const res = await request(app).post('/api/timers/start').send({ employeeId: 'not-a-uuid', taskTitle: '' });
    expect(res.status).toBe(400);
  });

  it('активный таймер сохраняется после повторного чтения (имитация перезапуска)', async () => {
    const emp = await createEmployee();
    await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'Долгая задача' }).expect(201);
    // Новый экземпляр приложения + новый клиент Prisma = имитация рестарта сервера.
    const app2 = makeApp();
    const active = await request(app2).get('/api/timers/active');
    expect(active.body.data.length).toBe(1);
    expect(active.body.data[0].taskTitle).toBe('Долгая задача');
  });
});

describe('Time entries', () => {
  it('фильтрация по сотруднику и пагинация', async () => {
    const e1 = await createEmployee({ name: 'Первый' });
    const e2 = await createEmployee({ name: 'Второй' });
    for (let i = 0; i < 3; i += 1) {
      const s = await request(app).post('/api/timers/start').send({ employeeId: e1.id, taskTitle: `T${i}` });
      await request(app).post(`/api/timers/${s.body.data.id}/stop`);
    }
    const s2 = await request(app).post('/api/timers/start').send({ employeeId: e2.id, taskTitle: 'Only' });
    await request(app).post(`/api/timers/${s2.body.data.id}/stop`);

    const res = await request(app).get(`/api/time-entries?employeeId=${e1.id}&pageSize=2&page=1`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.pagination.total).toBe(3);
    expect(res.body.data.pagination.totalPages).toBe(2);
  });

  it('поиск по названию задачи, пустой результат без ошибок', async () => {
    const emp = await createEmployee();
    const s = await request(app).post('/api/timers/start').send({ employeeId: emp.id, taskTitle: 'УникальнаяЗадача' });
    await request(app).post(`/api/timers/${s.body.data.id}/stop`);

    const found = await request(app).get(`/api/time-entries?search=${encodeURIComponent('УникальнаяЗадача')}`);
    expect(found.body.data.pagination.total).toBe(1);

    const empty = await request(app).get(`/api/time-entries?search=${encodeURIComponent('Несуществует123')}`);
    expect(empty.status).toBe(200);
    expect(empty.body.data.items).toEqual([]);
    expect(empty.body.data.pagination.total).toBe(0);
  });
});

describe('Reports', () => {
  it('пустой отчёт даёт нули и пустые массивы', async () => {
    const res = await request(app).get('/api/reports/summary?period=today');
    expect(res.status).toBe(200);
    expect(res.body.data.totalSeconds).toBe(0);
    expect(res.body.data.completedCount).toBe(0);
    expect(res.body.data.averageSeconds).toBe(0);

    const empRes = await request(app).get('/api/reports/employees?period=today');
    expect(empRes.body.data.items).toEqual([]);

    const dailyRes = await request(app).get('/api/reports/daily?period=today');
    expect(dailyRes.body.data.days.length).toBe(1);
    expect(dailyRes.body.data.days[0].totalSeconds).toBe(0);
  });

  it('запись, пересекающая границу периода, учитывается частично', async () => {
    const emp = await createEmployee();
    // Запись с 22:00 до 02:00 следующего дня (UTC)
    const dayStart = new Date(Date.UTC(2026, 0, 10, 22, 0, 0));
    const dayEnd = new Date(Date.UTC(2026, 0, 11, 2, 0, 0));
    await prisma.timeEntry.create({
      data: {
        employeeId: emp.id,
        taskTitle: 'Ночная смена',
        startedAt: dayStart,
        endedAt: dayEnd,
        durationSeconds: 4 * 3600,
      },
    });

    const jan10 = await request(app).get('/api/reports/summary?period=custom&from=2026-01-10&to=2026-01-10');
    expect(jan10.body.data.totalSeconds).toBe(2 * 3600); // только 22:00–00:00

    const jan11 = await request(app).get('/api/reports/summary?period=custom&from=2026-01-11&to=2026-01-11');
    expect(jan11.body.data.totalSeconds).toBe(2 * 3600); // только 00:00–02:00

    const both = await request(app).get('/api/reports/summary?period=custom&from=2026-01-10&to=2026-01-11');
    expect(both.body.data.totalSeconds).toBe(4 * 3600); // без дублирования
    expect(both.body.data.completedCount).toBe(1);
  });

  it('экспорт CSV с данными и защита от CSV-инъекций', async () => {
    const emp = await createEmployee({ name: 'Жужа =HYPERLINK("http://evil")' });
    const s = await request(app)
      .post('/api/timers/start')
      .send({ employeeId: emp.id, taskTitle: '=CMD|calc', description: '+dangerous,-xss,@y"quote"' });
    await new Promise((r) => setTimeout(r, 1100));
    await request(app).post(`/api/timers/${s.body.data.id}/stop`);

    const res = await request(app).get('/api/reports/export.csv?period=custom&from=2026-01-01&to=2100-01-01');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const text: string = res.text;
    expect(text.charCodeAt(0)).toBe(0xfeff); // BOM для кириллицы
    expect(text).toContain("'=CMD|calc"); // инъекция нейтрализована
    expect(text).toContain("'+dangerous,-xss,@y"); // инъекция нейтрализована: поле начинается с +
  });

  it('CSV при отсутствии данных → понятное сообщение', async () => {
    const res = await request(app).get('/api/reports/export.csv?period=today');
    expect(res.status).toBe(200);
    expect(res.body.data.empty).toBe(true);
  });

  it('некорректный период custom без from/to → 400', async () => {
    const res = await request(app).get('/api/reports/summary?period=custom');
    expect(res.status).toBe(400);
  });
});

describe('Errors', () => {
  it('несуществующий маршрут → 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('статус 404 для остановки несуществующего таймера', async () => {
    const res = await request(app).post('/api/timers/00000000-0000-0000-0000-000000000000/stop');
    expect(res.status).toBe(404);
  });
});
