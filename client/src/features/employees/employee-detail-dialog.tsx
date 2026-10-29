import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import type { Employee } from '../../types';

interface EmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEdit: (employee: Employee) => void;
  onArchive: (employee: Employee) => void;
}

export function EmployeeDetailDialog({ open, onOpenChange, employee, onEdit, onArchive }: EmployeeDetailDialogProps) {
  if (!employee) return null;

  const statusVariant = employee.status === 'active' ? 'active' : 'secondary';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee.name}</DialogTitle>
          <DialogDescription>{employee.position}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{employee.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{employee.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Статус</span>
            <Badge variant={statusVariant}>{employee.status === 'active' ? 'Активен' : 'Архивирован'}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Создан</span>
            <span>{new Date(employee.createdAt).toLocaleString('ru-RU')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Обновлён</span>
            <span>{new Date(employee.updatedAt).toLocaleString('ru-RU')}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Закрыть</Button>
          </DialogClose>
          <Button
            variant="outline"
            onClick={() => {
              onEdit(employee);
              onOpenChange(false);
            }}
          >
            Редактировать
          </Button>
          {employee.status === 'active' && (
            <Button
              variant="destructive"
              onClick={() => {
                onArchive(employee);
                onOpenChange(false);
              }}
            >
              Архивировать
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}