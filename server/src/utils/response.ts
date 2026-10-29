import { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data } as ApiSuccess<T>);
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}
