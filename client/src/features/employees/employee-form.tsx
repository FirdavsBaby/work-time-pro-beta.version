import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const schema = z.object({
  name: z.string().trim().min(1, 'Имя обязательно').max(200),
  position: z.string().trim().min(1, 'Должность обязательна').max(200),
  email: z.union([z.literal(''), z.string().trim().email('Некорректный email')]),
});

type FormValues = z.infer<typeof schema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<{ name: string; position: string; email: string | null }>;
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
  mode: 'create' | 'edit';
}

export function EmployeeForm({ open, onOpenChange, initial, onSubmit, isPending, mode }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        position: initial?.position ?? '',
        email: initial?.email ?? '',
      });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Новый сотрудник' : 'Редактировать сотрудника'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Добавьте нового сотрудника в систему.'
              : 'Измените данные сотрудника.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Имя *</Label>
            <Input id="name" placeholder="Иван Иванов" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">Должность *</Label>
            <Input id="position" placeholder="Разработчик" {...register('position')} />
            {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email (необязательно)</Label>
            <Input id="email" type="email" placeholder="ivan@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Отмена</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}