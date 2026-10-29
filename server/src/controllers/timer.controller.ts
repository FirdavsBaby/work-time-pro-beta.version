import { Request, Response } from 'express';
import * as timerService from '../services/timer.service';
import { startTimerSchema, activeTimersQuerySchema } from '../validators/timer.validator';
import { ok, created } from '../utils/response';

export async function start(req: Request, res: Response): Promise<void> {
  const input = startTimerSchema.parse(req.body);
  const entry = await timerService.startTimer(input);
  created(res, entry);
}

export async function stop(req: Request, res: Response): Promise<void> {
  const entry = await timerService.stopTimer(req.params.id);
  ok(res, entry);
}

export async function pause(req: Request, res: Response): Promise<void> {
  const entry = await timerService.pauseTimer(req.params.id);
  ok(res, entry);
}

export async function resume(req: Request, res: Response): Promise<void> {
  const entry = await timerService.resumeTimer(req.params.id);
  ok(res, entry);
}

export async function active(req: Request, res: Response): Promise<void> {
  const query = activeTimersQuerySchema.parse(req.query);
  const entries = await timerService.getActiveTimers(query.employeeId);
  ok(res, entries);
}
