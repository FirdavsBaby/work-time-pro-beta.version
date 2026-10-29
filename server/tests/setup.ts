import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Отдельная тестовая БД — не трогаем dev.db.
const testDbPath = path.resolve(__dirname, '..', 'prisma', 'test.db');
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.NODE_ENV = 'test';

for (const suffix of ['', '-journal', '-wal', '-shm']) {
  const f = testDbPath + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

execSync('npx prisma migrate deploy', {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
});
