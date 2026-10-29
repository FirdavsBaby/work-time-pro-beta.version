import * as React from 'react';

import { cn } from '../../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn('flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium', className)}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? fallback} className="h-full w-full object-cover" />
      ) : (
        <span className="text-muted-foreground">{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

export function AvatarFallback({ initials }: { initials: string }) {
  return <span className="text-muted-foreground">{initials.slice(0, 2).toUpperCase()}</span>;
}