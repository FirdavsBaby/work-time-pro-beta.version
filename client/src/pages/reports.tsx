import { useState } from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useReportSummary, useReportEmployees, useReportDaily } from '../hooks/useReports';
import { useEmployees } from '../hooks/useEmployees';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { formatDuration, formatDurationHuman, toDateInputValue } from '../utils/format';
import type { PeriodKind, ReportFilters } from '../types';

export function ReportsPage() {
  const [period, setPeriod] = useState<PeriodKind>('month');
  const [from, setFrom] = useState(() => toDateInputValue(new Date(Date.now() - 30 * 24 * 3600 * 1000)));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const [employeeId, setEmployeeId] = useState<string | undefined>();

  const filters: ReportFilters = {
    period,
    from: period === 'custom' ? from : undefined,
    to: period === 'custom' ? to : undefined,
    employeeId,
  };

  const { data: employeesData } = useEmployees();
  const summaryQuery = useReportSummary(filters);
  const empReportQuery = useReportEmployees(filters);
  const dailyQuery = useReportDaily(filters);

  const isLoading = summaryQuery.isLoading || empReportQuery.isLoading || dailyQuery.isLoading;

  const chartData = (dailyQuery.data?.days ?? []).map((d) => ({
    date: d.date.slice(5),
    hours: Number((d.totalSeconds / 3600).toFixed(1)),
    count: d.completedCount,
  }));

  const csvUrl = (() => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (period === 'custom') {
      if (from) params.set('from', from + 'T00:00:00Z');
      if (to) params.set('to', to + 'T23:59:59Z');
    }
    if (employeeId) params.set('employeeId', employeeId);
    return `${import.meta.env.VITE_API_URL ?? ''}/api/reports/export.csv?${params}`;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Отчёты и аналитика</h1>
          <p className="text-sm text-muted-foreground">Статистика рабочего времени, графики и экспорт CSV</p>
        </div>
        <Button asChild variant="outline">
          <a href={csvUrl} download>
            <Download className="mr-1.5 h-4 w-4" />
            Экспорт в CSV
          </a>
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
            <div className="w-full sm:w-44">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Период</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="week">Текущая неделя</SelectItem>
                  <SelectItem value="month">Текущий месяц</SelectItem>
                  <SelectItem value="custom">Произвольный период</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">С даты</label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">По дату</label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </>
            )}

            <div className="w-full sm:w-56">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Сотрудник</label>
              <Select
                value={employeeId ?? 'all'}
                onValueChange={(v) => setEmployeeId(v === 'all' ? undefined : v)}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Сводка */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : summaryQuery.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Суммарное время</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDurationHuman(summaryQuery.data.totalSeconds)}</div>
              <p className="text-xs text-muted-foreground font-mono">{formatDuration(summaryQuery.data.totalSeconds)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Завершённых задач</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryQuery.data.completedCount}</div>
              <p className="text-xs text-muted-foreground">за выбранный период</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Средняя длительность</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDurationHuman(summaryQuery.data.averageSeconds)}</div>
              <p className="text-xs text-muted-foreground font-mono">{formatDuration(summaryQuery.data.averageSeconds)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* График по дням */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Рабочее время по дням (часы)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Нет данных за выбранный период</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            <p className="text-muted-foreground">{payload[0].payload.count} задач</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Таблицы по сотрудникам и задачам */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статистика по сотрудникам</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !empReportQuery.data || empReportQuery.data.items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Задач</TableHead>
                    <TableHead className="text-right">Всего</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empReportQuery.data.items.map((row) => (
                    <TableRow key={row.employeeId}>
                      <TableCell className="font-medium">{row.employeeName}</TableCell>
                      <TableCell>{row.completedCount}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatDurationHuman(row.totalSeconds)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Распределение по задачам</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !empReportQuery.data || empReportQuery.data.tasks.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Задача</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead className="text-right">Всего</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empReportQuery.data.tasks.slice(0, 10).map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{t.taskTitle}</TableCell>
                      <TableCell>{t.count}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatDurationHuman(t.totalSeconds)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}