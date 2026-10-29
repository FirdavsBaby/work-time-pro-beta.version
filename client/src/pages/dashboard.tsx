import { useState } from 'react';
import { Users, Clock, CheckCircle2, Timer as TimerIcon, Plus, Play } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useDashboard } from '../hooks/useReports';
import { useEmployees, useCreateEmployee } from '../hooks/useEmployees';
import { useStartTimer, useStopTimer, usePauseTimer, useResumeTimer } from '../hooks/useTimers';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { ActiveTimerWidget } from '../features/timers/active-timer-widget';
import { TimerForm } from '../features/timers/timer-form';
import { EmployeeForm } from '../features/employees/employee-form';
import { formatDuration, formatDurationHuman, formatLocalTime } from '../utils/format';

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: employeesData } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const pauseTimerMutation = usePauseTimer();
  const resumeTimerMutation = useResumeTimer();

  const [createEmployeeOpen, setCreateEmployeeOpen] = useState(false);
  const [startTimerOpen, setStartTimerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Не удалось загрузить данные дашборда</p>
        <Button className="mt-4" onClick={() => refetch()}>Повторить</Button>
      </Card>
    );
  }

  const chartData = data.last7Days.map((d) => ({
    date: d.date.slice(5),
    hours: Number((d.totalSeconds / 3600).toFixed(1)),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-sm text-muted-foreground">Обзор активности и показатели за сегодня</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateEmployeeOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Сотрудник
          </Button>
          <Button size="sm" onClick={() => setStartTimerOpen(true)}>
            <Play className="mr-1.5 h-4 w-4 fill-current" />
            Запустить таймер
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Доступны для работы</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Время за сегодня</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDurationHuman(data.todaySeconds)}</div>
            <p className="text-xs text-muted-foreground">{formatDuration(data.todaySeconds)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Завершённые задачи</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayCompletedCount}</div>
            <p className="text-xs text-muted-foreground">За сегодня</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активные таймеры</CardTitle>
            <TimerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeTimersCount}</div>
            <p className="text-xs text-muted-foreground">Работают прямо сейчас</p>
          </CardContent>
        </Card>
      </div>

      {/* Список активных таймеров */}
      {data.activeList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Текущие активные таймеры</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {data.activeList.map((timer) => (
              <ActiveTimerWidget
                key={timer.id}
                timer={timer}
                onStop={(id) => stopTimerMutation.mutate(id)}
                onPause={(id) => pauseTimerMutation.mutate(id)}
                onResume={(id) => resumeTimerMutation.mutate(id)}
                isStopping={stopTimerMutation.isPending}
                isPausing={pauseTimerMutation.isPending}
                isResuming={resumeTimerMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* График за 7 дней */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Динамика рабочего времени (последние 7 дней, часы)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" stroke="currentColor" className="text-xs text-muted-foreground" />
                <YAxis stroke="currentColor" className="text-xs text-muted-foreground" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                          <p className="font-semibold">{payload[0].payload.date}</p>
                          <p className="text-primary">{payload[0].value} ч</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Последние записи */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние завершённые записи</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Записей пока нет</p>
          ) : (
            <div className="divide-y text-sm">
              {data.recentEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium">{e.taskTitle}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.employee?.name}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="font-mono font-medium">{formatDuration(e.durationSeconds)}</p>
                    <p className="text-xs text-muted-foreground">{formatLocalTime(e.endedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeForm
        open={createEmployeeOpen}
        onOpenChange={setCreateEmployeeOpen}
        onSubmit={(vals) => {
          createEmployeeMutation.mutate(vals, { onSuccess: () => setCreateEmployeeOpen(false) });
        }}
        isPending={createEmployeeMutation.isPending}
        mode="create"
      />

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