import { ReactNode } from 'react';
import { Button } from './button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      {Icon ? <div className="mb-3 text-muted-foreground">{Icon}</div> : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}