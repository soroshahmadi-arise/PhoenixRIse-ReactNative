import { GratitudeItem, formatStamp, groupByMonth } from '../gratitude';

describe('formatStamp', () => {
  test('today returns "Today · h:mm AM/PM"', () => {
    const now = new Date(2026, 4, 23, 14, 30);
    const ts = new Date(2026, 4, 23, 9, 15).getTime();
    expect(formatStamp(ts, now)).toBe('Today · 9:15 AM');
  });

  test('yesterday returns "Yesterday · h:mm AM/PM"', () => {
    const now = new Date(2026, 4, 23, 14, 30);
    const ts = new Date(2026, 4, 22, 22, 5).getTime();
    expect(formatStamp(ts, now)).toBe('Yesterday · 10:05 PM');
  });

  test('older returns weekday + day-of-month · time', () => {
    const now = new Date(2026, 4, 23, 14, 30); // Sat May 23 2026
    const ts = new Date(2026, 4, 18, 8, 0).getTime(); // Mon May 18 2026
    expect(formatStamp(ts, now)).toBe('Mon 18 · 8:00 AM');
  });

  test('midnight is 12:00 AM', () => {
    const now = new Date(2026, 4, 23, 14, 30);
    const ts = new Date(2026, 4, 23, 0, 0).getTime();
    expect(formatStamp(ts, now)).toBe('Today · 12:00 AM');
  });

  test('noon is 12:00 PM', () => {
    const now = new Date(2026, 4, 23, 14, 30);
    const ts = new Date(2026, 4, 23, 12, 0).getTime();
    expect(formatStamp(ts, now)).toBe('Today · 12:00 PM');
  });

  test('year boundary: Dec 31 viewed from Jan 1 is yesterday', () => {
    const now = new Date(2026, 0, 1, 10, 0);
    const ts = new Date(2025, 11, 31, 23, 30).getTime();
    expect(formatStamp(ts, now)).toBe('Yesterday · 11:30 PM');
  });
});

describe('groupByMonth', () => {
  test('empty input returns empty array', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  test('single item creates single group with month-year label', () => {
    const items: GratitudeItem[] = [
      { id: '1', text: 'a', createdAt: new Date(2026, 4, 23, 9, 0).getTime() },
    ];
    const groups = groupByMonth(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('May 2026');
    expect(groups[0].items).toHaveLength(1);
  });

  test('items in same month group together', () => {
    const items: GratitudeItem[] = [
      { id: '1', text: 'a', createdAt: new Date(2026, 4, 1, 9, 0).getTime() },
      { id: '2', text: 'b', createdAt: new Date(2026, 4, 15, 9, 0).getTime() },
      { id: '3', text: 'c', createdAt: new Date(2026, 4, 30, 9, 0).getTime() },
    ];
    const groups = groupByMonth(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(3);
  });

  test('items sorted newest first within a group', () => {
    const items: GratitudeItem[] = [
      { id: 'old', text: 'a', createdAt: new Date(2026, 4, 1, 9, 0).getTime() },
      { id: 'new', text: 'b', createdAt: new Date(2026, 4, 30, 9, 0).getTime() },
    ];
    const groups = groupByMonth(items);
    expect(groups[0].items[0].id).toBe('new');
    expect(groups[0].items[1].id).toBe('old');
  });

  test('year boundary: Dec 2025 and Jan 2026 are separate groups, newest first', () => {
    const items: GratitudeItem[] = [
      { id: 'dec', text: 'a', createdAt: new Date(2025, 11, 28, 9, 0).getTime() },
      { id: 'jan', text: 'b', createdAt: new Date(2026, 0, 5, 9, 0).getTime() },
    ];
    const groups = groupByMonth(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('January 2026');
    expect(groups[1].label).toBe('December 2025');
  });
});
