import {
  acceptDeposit,
  affordableSpendAmount,
  balanceFor,
  canSpendAmount,
  completeDay,
  depositForDay,
  formatMoney,
  itemsForDay,
  isMilestoneDay,
  remainingForDay,
  spentForDay,
  totalSpentForItems,
  type ProsperityState,
  type SpendItem,
} from '../prosperity';

const items: SpendItem[] = [
  { id: 'a', description: 'Retreat', amount: 600, day: 1 },
  { id: 'b', description: 'Books', amount: 120, day: 1 },
  { id: 'c', description: 'Trip', amount: 2000, day: 2 },
];

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

describe('spending calculations', () => {
  it('sums all spending and filters spending for a specific day', () => {
    expect(totalSpentForItems(items)).toBe(2720);
    expect(itemsForDay(items, 1)).toEqual([items[0], items[1]]);
    expect(spentForDay(items, 1)).toBe(720);
    expect(spentForDay(items, 3)).toBe(0);
  });

  it('calculates balance and the remaining amount for a day', () => {
    expect(balanceFor(3000, totalSpentForItems(items))).toBe(280);
    expect(remainingForDay(1, spentForDay(items, 1))).toBe(280);
    expect(remainingForDay(2, spentForDay(items, 2))).toBe(0);
  });

  it('never reports a negative balance', () => {
    expect(balanceFor(1000, 1200)).toBe(0);
  });

  it('only allows spending up to the available bank balance', () => {
    expect(canSpendAmount(500, 500)).toBe(true);
    expect(canSpendAmount(500, 501)).toBe(false);
    expect(canSpendAmount(500, 0)).toBe(false);
    expect(canSpendAmount(-100, 1)).toBe(false);
  });

  it('caps requested spending to the available bank balance', () => {
    expect(affordableSpendAmount(750, 1000)).toBe(750);
    expect(affordableSpendAmount(750, 500)).toBe(500);
    expect(affordableSpendAmount(0, 500)).toBe(0);
    expect(affordableSpendAmount(750, -50)).toBe(0);
  });
});

describe('game flow transitions', () => {
  const baseState: ProsperityState = {
    day: 2,
    totalReceived: 1000,
    items,
    accepted: false,
  };

  it('accepts the current day deposit once', () => {
    const accepted = acceptDeposit(baseState);

    expect(accepted.accepted).toBe(true);
    expect(accepted.totalReceived).toBe(3000);
    expect(acceptDeposit(accepted)).toBe(accepted);
  });

  it('only completes a day after the deposit is accepted', () => {
    expect(completeDay(baseState)).toBe(baseState);

    const completed = completeDay({ ...baseState, accepted: true });
    expect(completed.day).toBe(3);
    expect(completed.accepted).toBe(false);
  });
});
