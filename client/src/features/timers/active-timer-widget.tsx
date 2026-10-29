import { useEffect, useState } from 'react';
import { Square, Pause, Play, User } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { formatDuration, formatLocalTime } from '../../utils/format';
import type { TimeEntry } from '../../types';

interface ActiveTimerWidgetProps {
  timer: TimeEntry & { employee?: { name: string } };
  onStop: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  isStopping: boolean;
  isPausing: boolean;
  isResuming: boolean;
}

export function ActiveTimerWidget({ timer, onStop, onPause, onResume, isStopping, isPausing, isResuming }: ActiveTimerWidgetProps) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isPaused = !!timer.pausedAt;
  let elapsedSeconds = 0;
  if (isPaused) {
    const pausedAt = new Date(timer.pausedAt as string).getTime();
    elapsedSeconds = Math.max(0, Math.floor((pausedAt - new Date(timer.startedAt).getTime()) / 1000) - (timer.pausedSeconds ?? 0));
  } else {
    elapsedSeconds = Math.max(0, Math.floor((nowMs - new Date(timer.startedAt).getTime()) / 1000) - (timer.pausedSeconds ?? 0));
  }

  return (
    <Card className="border-primary/50 bg-primary/5 dark:bg-primary/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="active" className="animate-pulse">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            {isPaused ? 'На паузе' : 'Активный таймер'}
          </Badge>
          <span className="text-xs text-muted-foreground">Старт: {formatLocalTime(timer.startedAt)}</span>
        </div>
        <div className="font-mono text-2xl font-bold tracking-tight text-primary">
          {formatDuration(elapsedSeconds)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">{timer.taskTitle}</h4>
            {timer.description && <p className="text-sm text-muted-foreground">{timer.description}</p>}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{timer.employee?.name ?? '—'}</span>
            </div>
          </div>
          <div className="flex gap-3 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-[135px]"
              onClick={() => (!isPaused ? onPause(timer.id) : onResume(timer.id))}
              disabled={isPausing || isResuming}
            >
              {!isPaused ? (
                <>
                  <Pause className="mr-1.5 h-3.5 w-3.5" />
                  Пауза
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Продолжить
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-[135px]"
              onClick={() => onStop(timer.id)}
              disabled={isStopping}
            >
              <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
              Стоп
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}