import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Employee, PaginatedResult } from '../types';

const EMPLOYEES_KEY = ['employees'];

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: () => api.employees.list({ pageSize: 100 }),
    refetchOnWindowFocus: true,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, id],
    queryFn: () => api.employees.get(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.employees.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      toast.success('Сотрудник создан');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: Parameters<typeof api.employees.update>[1] }) =>
      api.employees.update(vars.id, vars.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      qc.invalidateQueries({ queryKey: [...EMPLOYEES_KEY, vars.id] });
      toast.success('Сотрудник обновлён');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useArchiveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.employees.archive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      toast.success('Сотрудник архивирован');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEmployeesPaginated(params: Parameters<typeof api.employees.list>[0]) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, 'list', params],
    queryFn: () => api.employees.list(params),
  });
}

export type EmployeePage = PaginatedResult<Employee>;