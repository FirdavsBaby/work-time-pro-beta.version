import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import type { Employee } from '../../types';

const schema = z.object({
  employeeId: z.string().uuid('Выберите сотрудника'),
  taskTitle: z.string().trim().min(1, 'Название задачи обязательно').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface TimerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
}

export function TimerForm({ open, onOpenChange, employees, onSubmit, isPending }: TimerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedEmployeeId = watch('employeeId');

  useEffect(() => {
    if (open) {
      reset({ employeeId: '', taskTitle: '', description: '' });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Запуск таймера</DialogTitle>
          <DialogDescription>Выберите сотрудника и задачу, затем начните работу.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Сотрудник *</Label>
            <Select
              onValueChange={(v) => setValue('employeeId', v as string)}
              value={selectedEmployeeId ?? ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id} disabled={e.status !== 'active'}>
                    {e.name} {e.status === 'archived' ? '(архив)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taskTitle">Название задачи *</Label>
            <Input id="taskTitle" placeholder="Разработка модуля" {...register('taskTitle')} />
            {errors.taskTitle && <p className="text-sm text-destructive">{errors.taskTitle.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Input id="description" placeholder="Краткое описание задачи" {...register('description')} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Отмена</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>Начать работу</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}