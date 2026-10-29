export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  taskTitle: string;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  pausedAt: string | null;
  pausedSeconds: number;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
  employee?: Pick<Employee, 'id' | 'name' | 'position'>;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface DashboardStats {
  activeEmployees: number;
  todaySeconds: number;
  todayCompletedCount: number;
  activeTimersCount: number;
  last7Days: Array<{ date: string; totalSeconds: number; completedCount: number }>;
  recentEntries: Array<TimeEntry & { employee: { id: string; name: string } }>;
  activeList: Array<TimeEntry & { employee: { id: string; name: string } }>;
}

export interface ReportSummary {
  totalSeconds: number;
  completedCount: number;
  averageSeconds: number;
  activeCount: number;
  period: { from: string; to: string };
}

export interface EmployeeStat {
  employeeId: string;
  employeeName: string;
  totalSeconds: number;
  completedCount: number;
  averageSeconds: number;
}

export interface TaskBreakdownItem {
  taskTitle: string;
  totalSeconds: number;
  count: number;
}

export interface DailyPoint {
  date: string;
  totalSeconds: number;
  completedCount: number;
}

export type PeriodKind = 'today' | 'week' | 'month' | 'custom';

export interface ReportFilters {
  period: PeriodKind;
  from?: string;
  to?: string;
  employeeId?: string;
}
