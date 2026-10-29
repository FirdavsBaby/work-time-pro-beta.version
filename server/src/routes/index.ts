import { Router } from 'express';
import { prisma } from '../db/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { ok } from '../utils/response';
import * as employeeCtrl from '../controllers/employee.controller';
import * as timerCtrl from '../controllers/timer.controller';
import * as timeEntryCtrl from '../controllers/timeEntry.controller';
import * as reportCtrl from '../controllers/report.controller';

export const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    ok(res, { status: dbOk ? 'ok' : 'degraded', database: dbOk, timestamp: new Date().toISOString() }, dbOk ? 200 : 503);
  }),
);

// Employees
router.get('/employees', asyncHandler(employeeCtrl.list));
router.post('/employees', asyncHandler(employeeCtrl.create));
router.get('/employees/:id', asyncHandler(employeeCtrl.getById));
router.patch('/employees/:id', asyncHandler(employeeCtrl.update));
router.patch('/employees/:id/archive', asyncHandler(employeeCtrl.archive));

// Time entries
router.get('/time-entries', asyncHandler(timeEntryCtrl.list));
router.get('/time-entries/:id', asyncHandler(timeEntryCtrl.getById));

// Timers
router.post('/timers/start', asyncHandler(timerCtrl.start));
router.post('/timers/:id/stop', asyncHandler(timerCtrl.stop));
router.post('/timers/:id/pause', asyncHandler(timerCtrl.pause));
router.post('/timers/:id/resume', asyncHandler(timerCtrl.resume));
router.get('/timers/active', asyncHandler(timerCtrl.active));

// Reports
router.get('/reports/summary', asyncHandler(reportCtrl.summary));
router.get('/reports/employees', asyncHandler(reportCtrl.employees));
router.get('/reports/daily', asyncHandler(reportCtrl.daily));
router.get('/reports/dashboard', asyncHandler(reportCtrl.dashboard));
router.get('/reports/export.csv', asyncHandler(reportCtrl.exportCsv));
