export const STORAGE_KEY = 'phoenix-rise/prosperity/v1';
export const DEPOSIT_STEP = 1000;

export type SpendItem = {
  id: string;
  description: string;
  amount: number;
  image?: string | null;
  day: number;
};

/** The slice of game state that persists across sessions. */
export type ProsperityState = {
  day: number;
  totalReceived: number;
  items: SpendItem[];
  accepted: boolean;
};

/** Deposit for a given day: $1,000 x day. */
export const depositForDay = (day: number) => Math.max(0, day) * DEPOSIT_STEP;

export const formatMoney = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US');

/** Days worth celebrating as the deposit climbs. */
export const isMilestoneDay = (day: number) =>
  day === 5 || day === 10 || (day % 25 === 0 && day > 0);

export const totalSpentForItems = (items: SpendItem[]) =>
  items.reduce((sum, item) => sum + item.amount, 0);

export const itemsForDay = (items: SpendItem[], day: number) =>
  items.filter((item) => item.day === day);

export const spentForDay = (items: SpendItem[], day: number) =>
  itemsForDay(items, day).reduce((sum, item) => sum + item.amount, 0);

/** Distinct game days with at least one item, most-recent first. */
export const daysWithSpending = (items: SpendItem[]): number[] =>
  Array.from(new Set(items.map((item) => item.day))).sort((a, b) => b - a);

export type LookBack = { yesterday: number; last7: number; last30: number };

/**
 * Totals for prior periods relative to currentDay (currentDay is EXCLUDED).
 * Windows are clamped at day 1 so no non-positive days are ever read.
 *   yesterday = day-1; last7 = days [day-7 .. day-1]; last30 = [day-30 .. day-1].
 */
export const lookBack = (items: SpendItem[], currentDay: number): LookBack => {
  const sumWindow = (span: number) => {
    let total = 0;
    for (let d = Math.max(1, currentDay - span); d <= currentDay - 1; d++) {
      total += spentForDay(items, d);
    }
    return total;
  };
  return {
    yesterday: currentDay > 1 ? spentForDay(items, currentDay - 1) : 0,
    last7: sumWindow(7),
    last30: sumWindow(30),
  };
};

export const balanceFor = (totalReceived: number, totalSpent: number) =>
  Math.max(0, totalReceived - totalSpent);

export const remainingForDay = (day: number, spentToday: number) =>
  depositForDay(day) - spentToday;

export const canSpendAmount = (availableBalance: number, amount: number) =>
  amount > 0 && amount <= Math.max(0, availableBalance);

export const affordableSpendAmount = (availableBalance: number, requestedAmount: number) =>
  Math.min(Math.max(0, availableBalance), Math.max(0, requestedAmount));

export const acceptDeposit = (state: ProsperityState): ProsperityState => {
  if (state.accepted) return state;
  return {
    ...state,
    accepted: true,
    totalReceived: state.totalReceived + depositForDay(state.day),
  };
};

export const completeDay = (state: ProsperityState): ProsperityState => {
  if (!state.accepted) return state;
  return {
    ...state,
    day: state.day + 1,
    accepted: false,
  };
};
