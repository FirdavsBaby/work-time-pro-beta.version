import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { ReportFilters } from '../types';

const REPORTS_KEY = ['reports'];

export function useDashboard() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'dashboard'],
    queryFn: api.reports.dashboard,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useReportSummary(filters: ReportFilters) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'summary', filters],
    queryFn: () => api.reports.summary(filters),
  });
}

export function useReportEmployees(filters: ReportFilters) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'employees', filters],
    queryFn: () => api.reports.employees(filters),
  });
}

export function useReportDaily(filters: ReportFilters) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'daily', filters],
    queryFn: () => api.reports.daily(filters),
  });
}

export function useReportCsvUrl(filters: ReportFilters): string {
  return api.reports.exportCsvUrl(filters);
}