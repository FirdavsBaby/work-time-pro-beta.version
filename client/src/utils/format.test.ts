import { describe, it, expect } from 'vitest';
import { formatDuration, formatDurationHuman } from '../utils/format';

describe('Format utilities', () => {
  it('formatDuration переводит секунды в HH:MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3665)).toBe('01:01:05');
    expect(formatDuration(null)).toBe('—');
  });

  it('formatDurationHuman переводит в понятный вид', () => {
    expect(formatDurationHuman(0)).toBe('0 мин');
    expect(formatDurationHuman(1800)).toBe('30 мин');
    expect(formatDurationHuman(3600)).toBe('1 ч');
    expect(formatDurationHuman(5400)).toBe('1 ч 30 мин');
  });
});