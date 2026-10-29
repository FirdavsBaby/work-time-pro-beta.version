import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, LayoutDashboard, Users, Timer, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';

const NAV = [
  { to: '/', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/employees', label: 'Сотрудники', icon: Users },
  { to: '/time', label: 'Учёт времени', icon: Timer },
  { to: '/reports', label: 'Отчёты', icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Timer className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">WorkTime Pro</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <Avatar fallback="WT" className="h-8 w-8" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Демо-пользователь</p>
              <p className="truncate text-[10px] text-muted-foreground">worktime.local</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Timer className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">WorkTime Pro</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Переключить тему">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
        )}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-card transition-transform duration-200 md:hidden',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="text-lg font-semibold">WorkTime Pro</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}