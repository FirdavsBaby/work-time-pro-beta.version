import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { TimeEntry } from '../types';

const TIMERS_KEY = ['timers'];
const ENTRIES_KEY = ['time-entries'];

export function useActiveTimers(employeeId?: string) {
  return useQuery({
    queryKey: [...TIMERS_KEY, 'active', employeeId],
    queryFn: () => api.timers.active(employeeId),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.timers.start,
    onSuccess: (updatedEntry) => {
      // Оптимистично добавляем новый таймер в кеши
      qc.setQueriesData({ queryKey: TIMERS_KEY }, (old: any) => {
        if (!Array.isArray(old)) return [updatedEntry];
        return [updatedEntry, ...old];
      });
      qc.setQueriesData({ queryKey: ['reports'] }, (old: any) => {
        if (!old || !Array.isArray(old.activeList)) return old;
        return {
          ...old,
          activeTimersCount: (old.activeTimersCount ?? 0) + 1,
          activeList: [updatedEntry, ...old.activeList],
        };
      });
      qc.invalidateQueries({ queryKey: ENTRIES_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Таймер запущен');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.timers.stop,
    onSuccess: (updatedEntry) => {
      // Удаляем из активных таймеров
      qc.setQueriesData({ queryKey: TIMERS_KEY }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((t: any) => t.id !== updatedEntry.id);
      });
      qc.setQueriesData({ queryKey: ['reports'] }, (old: any) => {
        if (!old || !Array.isArray(old.activeList)) return old;
        return {
          ...old,
          activeTimersCount: Math.max(0, (old.activeTimersCount ?? 1) - 1),
          activeList: old.activeList.filter((t: any) => t.id !== updatedEntry.id),
        };
      });
      qc.invalidateQueries({ queryKey: ENTRIES_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Таймер остановлен');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

function applyTimerUpdate(qc: ReturnType<typeof useQueryClient>, updatedEntry: TimeEntry) {
  qc.setQueriesData({ queryKey: TIMERS_KEY }, (old: any) => {
    if (!Array.isArray(old)) return old;
    return old.map((t: any) => (t.id === updatedEntry.id ? updatedEntry : t));
  });
  qc.setQueriesData({ queryKey: ['reports'] }, (old: any) => {
    if (!old || !Array.isArray(old.activeList)) return old;
    return {
      ...old,
      activeList: old.activeList.map((t: any) => (t.id === updatedEntry.id ? updatedEntry : t)),
    };
  });
  qc.setQueriesData({ queryKey: ENTRIES_KEY }, (old: any) => {
    if (!old || !Array.isArray(old.items)) return old;
    return {
      ...old,
      items: old.items.map((t: any) => (t.id === updatedEntry.id ? updatedEntry : t)),
    };
  });
}

export function usePauseTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.timers.pause,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: TIMERS_KEY });
      const now = new Date().toISOString();
      qc.setQueriesData({ queryKey: TIMERS_KEY }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => (t.id === id ? { ...t, pausedAt: now } : t));
      });
      qc.setQueriesData({ queryKey: ['reports'] }, (old: any) => {
        if (!old || !Array.isArray(old.activeList)) return old;
        return {
          ...old,
          activeList: old.activeList.map((t: any) => (t.id === id ? { ...t, pausedAt: now } : t)),
        };
      });
      qc.setQueriesData({ queryKey: ENTRIES_KEY }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((t: any) => (t.id === id ? { ...t, pausedAt: now } : t)),
        };
      });
    },
    onSuccess: (updatedEntry) => {
      applyTimerUpdate(qc, updatedEntry);
      qc.invalidateQueries({ queryKey: ENTRIES_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Таймер на паузе');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResumeTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.timers.resume,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: TIMERS_KEY });
      qc.setQueriesData({ queryKey: TIMERS_KEY }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => (t.id === id ? { ...t, pausedAt: null } : t));
      });
      qc.setQueriesData({ queryKey: ['reports'] }, (old: any) => {
        if (!old || !Array.isArray(old.activeList)) return old;
        return {
          ...old,
          activeList: old.activeList.map((t: any) => (t.id === id ? { ...t, pausedAt: null } : t)),
        };
      });
      qc.setQueriesData({ queryKey: ENTRIES_KEY }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((t: any) => (t.id === id ? { ...t, pausedAt: null } : t)),
        };
      });
    },
    onSuccess: (updatedEntry) => {
      applyTimerUpdate(qc, updatedEntry);
      qc.invalidateQueries({ queryKey: ENTRIES_KEY });
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Таймер продолжен');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}


export function useTimeEntries(params: Parameters<typeof api.timeEntries.list>[0]) {
  return useQuery({
    queryKey: [...ENTRIES_KEY, params],
    queryFn: () => api.timeEntries.list(params),
    refetchOnWindowFocus: true,
  });
}

export function useTimeEntry(id: string) {
  return useQuery({
    queryKey: [...ENTRIES_KEY, id],
    queryFn: () => api.timeEntries.get(id),
    enabled: !!id,
  });
}

export type { TimeEntry };