import { describe, it, expect } from 'vitest';
import { formatTimestamp, formatDayLabel, getEventFraction, KEY_EVENTS, calculateSeekIndex } from '../TimelineBar';

describe('TimelineBar helpers and constants', () => {
  describe('calculateSeekIndex', () => {
    it('calculates correct index for various click positions', () => {
      // 100 frames total (indices 0 to 99)
      expect(calculateSeekIndex(0, 0, 100, 100)).toBe(0);
      expect(calculateSeekIndex(50, 0, 100, 100)).toBe(50);
      expect(calculateSeekIndex(100, 0, 100, 100)).toBe(99);
      expect(calculateSeekIndex(25.4, 0, 100, 100)).toBe(25);
      expect(calculateSeekIndex(75.6, 0, 100, 100)).toBe(75);
    });

    it('handles out-of-bounds clicks correctly', () => {
      expect(calculateSeekIndex(-10, 0, 100, 100)).toBe(0);
      expect(calculateSeekIndex(110, 0, 100, 100)).toBe(99);
    });

    it('returns 0 if frameCount is 0 or less', () => {
      expect(calculateSeekIndex(50, 0, 100, 0)).toBe(0);
      expect(calculateSeekIndex(50, 0, 100, -1)).toBe(0);
    });
  });
  describe('KEY_EVENTS', () => {
    it('contains chronological events within conflict period', () => {
      const dates = KEY_EVENTS.map(e => e.date);
      // Conflict starts 2026-02-25
      dates.forEach(date => {
        const d = new Date(date);
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBeGreaterThanOrEqual(1); // Feb is 1
      });
      // Should be sorted
      for (let i = 1; i < dates.length; i++) {
        expect(new Date(dates[i]).getTime()).toBeGreaterThanOrEqual(new Date(dates[i-1]).getTime());
      }
    });
  });
  describe('formatTimestamp', () => {
    it('formats ISO string correctly', () => {
      const iso = '2026-03-01T14:30:00Z';
      const formatted = formatTimestamp(iso);
      const d = new Date(iso);
      const expected = d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      expect(formatted).toBe(expected);
    });

    it('returns original string on error', () => {
      expect(formatTimestamp('invalid')).toBe('invalid');
    });
  });

  describe('formatDayLabel', () => {
    it('calculates day of conflict correctly', () => {
      // Start date is 2026-02-25
      expect(formatDayLabel('2026-02-25T12:00:00Z')).toBe('Day 0 of conflict');
      expect(formatDayLabel('2026-02-26T12:00:00Z')).toBe('Day 1 of conflict');
      expect(formatDayLabel('2026-03-01T12:00:00Z')).toBe('Day 4 of conflict');
    });

    it('returns empty string for dates before conflict start', () => {
      expect(formatDayLabel('2026-02-24T12:00:00Z')).toBe('');
    });

    it('returns empty string on error', () => {
      expect(formatDayLabel('invalid')).toBe('');
    });
  });

  describe('getEventFraction', () => {
    const timestamps = [
      '2026-02-25T00:00:00Z',
      '2026-02-26T00:00:00Z',
      '2026-02-27T00:00:00Z',
      '2026-02-28T00:00:00Z',
      '2026-03-01T00:00:00Z',
    ];

    it('calculates correct fraction for start of day', () => {
      expect(getEventFraction(timestamps, '2026-02-25')).toBe(0);
      expect(getEventFraction(timestamps, '2026-02-27')).toBe(0.5);
      expect(getEventFraction(timestamps, '2026-03-01')).toBe(1);
    });

    it('returns null if date prefix not found', () => {
      expect(getEventFraction(timestamps, '2026-03-05')).toBeNull();
    });

    it('returns null if timestamps too short', () => {
      expect(getEventFraction(['2026-02-25T00:00:00Z'], '2026-02-25')).toBeNull();
    });
  });
});
