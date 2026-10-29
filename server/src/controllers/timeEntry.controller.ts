import { Request, Response } from 'express';
import * as timeEntryService from '../services/timeEntry.service';
import { timeEntriesQuerySchema } from '../validators/report.validator';
import { AppError } from '../utils/AppError';
import { ok } from '../utils/response';

export async function list(req: Request, res: Response): Promise<void> {
  const query = timeEntriesQuerySchema.parse(req.query);
  const result = await timeEntryService.listTimeEntries(query);
  ok(res, result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const entry = await timeEntryService.getTimeEntryById(req.params.id);
  if (!entry) throw AppError.notFound('Запись не найдена');
  ok(res, entry);
}
