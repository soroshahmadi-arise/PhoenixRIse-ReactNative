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
