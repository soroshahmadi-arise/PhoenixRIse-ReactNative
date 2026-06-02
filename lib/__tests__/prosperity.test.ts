import { depositForDay, formatMoney, isMilestoneDay } from '../prosperity';

describe('depositForDay', () => {
  it('returns $1,000 times the day number', () => {
    expect(depositForDay(1)).toBe(1000);
    expect(depositForDay(7)).toBe(7000);
  });

  it('never returns a negative deposit', () => {
    expect(depositForDay(0)).toBe(0);
    expect(depositForDay(-3)).toBe(0);
  });
});

describe('formatMoney', () => {
  it('rounds and formats whole-dollar values with separators', () => {
    expect(formatMoney(1000)).toBe('$1,000');
    expect(formatMoney(1234567.49)).toBe('$1,234,567');
    expect(formatMoney(1234567.5)).toBe('$1,234,568');
  });
});

describe('isMilestoneDay', () => {
  it('celebrates days 5, 10, and positive multiples of 25', () => {
    expect(isMilestoneDay(5)).toBe(true);
    expect(isMilestoneDay(10)).toBe(true);
    expect(isMilestoneDay(25)).toBe(true);
    expect(isMilestoneDay(50)).toBe(true);
  });

  it('does not celebrate ordinary or non-positive days', () => {
    expect(isMilestoneDay(1)).toBe(false);
    expect(isMilestoneDay(24)).toBe(false);
    expect(isMilestoneDay(0)).toBe(false);
    expect(isMilestoneDay(-25)).toBe(false);
  });
});
