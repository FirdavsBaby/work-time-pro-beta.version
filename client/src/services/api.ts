const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  let envelope: Envelope<T>;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiRequestError(res.status, 'PARSE_ERROR', `Некорректный ответ сервера (${res.status})`);
  }

  if (!res.ok || !envelope.success) {
    const err = envelope.error;
    throw new ApiRequestError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? `Ошибка ${res.status}`, err?.details);
  }
  return envelope.data as T;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  return sp;
}

export const api = {
  health: () => request<{ status: string; database: boolean }>('/api/health'),

  employees: {
    list: (params: { status?: string; search?: string; page?: number; pageSize?: number }) =>
      request<import('../types').PaginatedResult<import('../types').Employee>>(
        `/api/employees?${qs(params)}`,
      ),
    get: (id: string) => request<import('../types').Employee>(`/api/employees/${id}`),
    create: (data: { name: string; position: string; email?: string }) =>
      request<import('../types').Employee>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; position: string; email: string }>) =>
      request<import('../types').Employee>(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archive: (id: string) =>
      request<import('../types').Employee>(`/api/employees/${id}/archive`, { method: 'PATCH' }),
  },

  timers: {
    start: (data: { employeeId: string; taskTitle: string; description?: string }) =>
      request<import('../types').TimeEntry>('/api/timers/start', { method: 'POST', body: JSON.stringify(data) }),
    stop: (id: string) =>
      request<import('../types').TimeEntry>(`/api/timers/${id}/stop`, { method: 'POST' }),
    pause: (id: string) =>
      request<import('../types').TimeEntry>(`/api/timers/${id}/pause`, { method: 'POST' }),
    resume: (id: string) =>
      request<import('../types').TimeEntry>(`/api/timers/${id}/resume`, { method: 'POST' }),
    active: (employeeId?: string) =>
      request<import('../types').TimeEntry[]>(`/api/timers/active?${qs({ employeeId })}`),
  },

  timeEntries: {
    list: (params: {
      employeeId?: string;
      from?: string;
      to?: string;
      search?: string;
      status?: string;
      sortBy?: string;
      sortDir?: string;
      page?: number;
      pageSize?: number;
    }) => request<import('../types').PaginatedResult<import('../types').TimeEntry>>(`/api/time-entries?${qs(params)}`),
    get: (id: string) => request<import('../types').TimeEntry>(`/api/time-entries/${id}`),
  },

  reports: {
    dashboard: () => request<import('../types').DashboardStats>('/api/reports/dashboard'),
    summary: (filters: import('../types').ReportFilters) =>
      request<import('../types').ReportSummary>(`/api/reports/summary?${qs(filters as unknown as Record<string, string | number | boolean | null | undefined>)}`),
    employees: (filters: import('../types').ReportFilters) =>
      request<{ items: import('../types').EmployeeStat[]; tasks: import('../types').TaskBreakdownItem[] }>(
        `/api/reports/employees?${qs(filters as unknown as Record<string, string | number | boolean | null | undefined>)}`,
      ),
    daily: (filters: import('../types').ReportFilters) =>
      request<{ days: import('../types').DailyPoint[] }>(`/api/reports/daily?${qs(filters as unknown as Record<string, string | number | boolean | null | undefined>)}`),
    exportCsvUrl: (filters: import('../types').ReportFilters): string =>
      `${BASE_URL}/api/reports/export.csv?${qs(filters as unknown as Record<string, string | number | boolean | null | undefined>)}`,
  },
};
