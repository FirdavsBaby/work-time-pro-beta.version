import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useEmployeesPaginated, useCreateEmployee, useUpdateEmployee, useArchiveEmployee } from '../hooks/useEmployees';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { EmployeeForm } from '../features/employees/employee-form';
import { EmployeeDetailDialog } from '../features/employees/employee-detail-dialog';
import type { Employee } from '../types';

export function EmployeesPage() {
  const [status, setStatus] = useState<'active' | 'archived' | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  const { data, isLoading, isError } = useEmployeesPaginated({
    status,
    search: search || undefined,
    page,
    pageSize: 10,
  });

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const archiveMutation = useArchiveEmployee();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Сотрудники</h1>
          <p className="text-sm text-muted-foreground">Управление персоналом и просмотр профилей</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Добавить сотрудника
        </Button>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={status ?? 'all'}
                onValueChange={(v) => {
                  setStatus(v === 'all' ? undefined : (v as 'active' | 'archived'));
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Только активные</SelectItem>
                  <SelectItem value="archived">В архиве</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-6 text-center text-destructive">Ошибка загрузки списка сотрудников</p>
          ) : !data || data.items.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              {search || status ? 'Сотрудники не найдены по выбранным фильтрам' : 'Сотрудников пока нет'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setDetailEmployee(e)}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.position}</TableCell>
                    <TableCell className="text-muted-foreground">{e.email ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === 'active' ? 'active' : 'secondary'}>
                        {e.status === 'active' ? 'Активен' : 'В архиве'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditEmployee(e)}
                        >
                          Изменить
                        </Button>
                        {e.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => archiveMutation.mutate(e.id)}
                            disabled={archiveMutation.isPending}
                          >
                            В архив
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Пагинация */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
              <span>
                Страница {data.pagination.page} из {data.pagination.totalPages} (всего {data.pagination.total})
              </span>
              <div className="flex gap-2">
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

      <EmployeeForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(vals) => {
          createMutation.mutate(vals, { onSuccess: () => setCreateOpen(false) });
        }}
        isPending={createMutation.isPending}
        mode="create"
      />

      <EmployeeForm
        open={!!editEmployee}
        onOpenChange={(op) => !op && setEditEmployee(null)}
        initial={editEmployee ?? undefined}
        onSubmit={(vals) => {
          if (editEmployee) {
            updateMutation.mutate({ id: editEmployee.id, data: vals }, { onSuccess: () => setEditEmployee(null) });
          }
        }}
        isPending={updateMutation.isPending}
        mode="edit"
      />

      <EmployeeDetailDialog
        open={!!detailEmployee}
        onOpenChange={(op) => !op && setDetailEmployee(null)}
        employee={detailEmployee}
        onEdit={(e) => setEditEmployee(e)}
        onArchive={(e) => archiveMutation.mutate(e.id)}
      />
    </div>
  );
}