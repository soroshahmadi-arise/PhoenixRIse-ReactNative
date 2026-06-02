export const STORAGE_KEY = 'phoenix-rise/prosperity/v1';

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
