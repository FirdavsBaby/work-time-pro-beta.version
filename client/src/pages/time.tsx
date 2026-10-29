import { useState } from 'react';
import { Search, Play, Square, Pause } from 'lucide-react';
import { useTimeEntries, useStartTimer, useStopTimer, usePauseTimer, useResumeTimer } from '../hooks/useTimers';
import { useEmployees } from '../hooks/useEmployees';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { TimerForm } from '../features/timers/timer-form';
import { formatDuration, formatLocalDateTime } from '../utils/format';

export function TimePage() {
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [startTimerOpen, setStartTimerOpen] = useState(false);

  const { data: employeesData } = useEmployees();
  const { data, isLoading, isError } = useTimeEntries({
    employeeId,
    search: search || undefined,
    status,
    page,
    pageSize: 15,
  });

  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const pauseTimerMutation = usePauseTimer();
  const resumeTimerMutation = useResumeTimer();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Учёт времени</h1>
          <p className="text-sm text-muted-foreground">История записей рабочего времени и активные таймеры</p>
        </div>
        <Button onClick={() => setStartTimerOpen(true)}>
          <Play className="mr-1.5 h-4 w-4 fill-current" />
          Запустить таймер
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию задачи..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={employeeId ?? 'all'}
              onValueChange={(v) => {
                setEmployeeId(v === 'all' ? undefined : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все сотрудники" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сотрудники</SelectItem>
                {employeesData?.items.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все записи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все записи</SelectItem>
                <SelectItem value="active">Только активные</SelectItem>
                <SelectItem value="completed">Только завершённые</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-6 text-center text-destructive">Ошибка загрузки записей времени</p>
          ) : !data || data.items.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">Записи не найдены</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Задача</TableHead>
                  <TableHead>Старт</TableHead>
                  <TableHead>Окончание</TableHead>
                  <TableHead>Длительность</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((e) => {
                  const isActive = e.endedAt === null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.employee?.name ?? '—'}</TableCell>
                      <TableCell>
                        <p className="font-medium">{e.taskTitle}</p>
                        {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                      </TableCell>
                      <TableCell className="text-xs">{formatLocalDateTime(e.startedAt)}</TableCell>
                      <TableCell className="text-xs">{e.endedAt ? formatLocalDateTime(e.endedAt) : '—'}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {isActive ? 'в работе…' : formatDuration(e.durationSeconds)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'active' : 'secondary'}>
                          {isActive ? 'Активен' : 'Завершён'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isActive && (
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-[135px]"
                              onClick={() => (!e.pausedAt ? pauseTimerMutation.mutate(e.id) : resumeTimerMutation.mutate(e.id))}
                              disabled={pauseTimerMutation.isPending || resumeTimerMutation.isPending}
                            >
                              {!e.pausedAt ? (
                                <>
                                  <Pause className="mr-1.5 h-3 w-3" />
                                  Пауза
                                </>
                              ) : (
                                <>
                                  <Play className="mr-1.5 h-3 w-3 fill-current" />
                                  Продолжить
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-[135px]"
                              onClick={() => stopTimerMutation.mutate(e.id)}
                              disabled={stopTimerMutation.isPending}
                            >
                              <Square className="mr-1.5 h-3 w-3 fill-current" />
                              Стоп
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
              <span>
                Страница {data.pagination.page} из {data.pagination.totalPages} (всего {data.pagination.total})
              </span>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TimerForm
        open={startTimerOpen}
        onOpenChange={setStartTimerOpen}
        employees={employeesData?.items ?? []}
        onSubmit={(vals) => {
          startTimerMutation.mutate(vals, { onSuccess: () => setStartTimerOpen(false) });
        }}
        isPending={startTimerMutation.isPending}
      />
    </div>
  );
}