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

export const balanceFor = (totalReceived: number, totalSpent: number) =>
  totalReceived - totalSpent;

export const remainingForDay = (day: number, spentToday: number) =>
  depositForDay(day) - spentToday;

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
