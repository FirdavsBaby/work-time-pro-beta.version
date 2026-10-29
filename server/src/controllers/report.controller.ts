import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { reportQuerySchema } from '../validators/report.validator';
import { buildCsv } from '../utils/csv';
import { ok } from '../utils/response';

export async function summary(req: Request, res: Response): Promise<void> {
  const query = reportQuerySchema.parse(req.query);
  const data = await reportService.getSummary(query);
  ok(res, data);
}

export async function employees(req: Request, res: Response): Promise<void> {
  const query = reportQuerySchema.parse(req.query);
  const items = await reportService.getEmployeesReport(query);
  const tasks = await reportService.getTasksBreakdown(query);
  ok(res, { items, tasks });
}

export async function daily(req: Request, res: Response): Promise<void> {
  const query = reportQuerySchema.parse(req.query);
  const days = await reportService.getDailyReport(query);
  ok(res, { days });
}

export async function dashboard(_req: Request, res: Response): Promise<void> {
  const stats = await reportService.getDashboardStats();
  ok(res, stats);
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const query = reportQuerySchema.parse(req.query);
  const rows = await reportService.getCsvRows(query);

  if (rows.length === 0) {
    res.status(200).json({
      success: true,
      data: { empty: true, message: 'Нет данных для экспорта в выбранном периоде' },
    });
    return;
  }

  const csv = buildCsv(
    ['Сотрудник', 'Задача', 'Описание', 'Дата начала', 'Время начала', 'Время окончания', 'Продолжительность'],
    rows.map((r) => [r.employeeName, r.taskTitle, r.description, r.startDate, r.startTime, r.endTime, r.durationHMS]),
  );

  const filename = `worktime-report-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}
