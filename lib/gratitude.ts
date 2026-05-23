export type GratitudeItem = {
  id: string;
  text: string;
  createdAt: number;
};

export type GratitudeGroup = {
  key: string;
  label: string;
  items: GratitudeItem[];
};

export function formatStamp(ts: number, now: Date = new Date()): string {
  const d = new Date(ts);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const time = `${hours}:${minutes} ${ampm}`;
  if (sameDay) return `Today · ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday · ${time}`;
  const weekday = d.toLocaleString('en-US', { weekday: 'short' });
  return `${weekday} ${d.getDate()} · ${time}`;
}

export function groupByMonth(items: GratitudeItem[]): GratitudeGroup[] {
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  const groups: GratitudeGroup[] = [];
  const map = new Map<string, GratitudeGroup>();
  for (const it of sorted) {
    const d = new Date(it.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        label: d.toLocaleString('en-US', { month: 'long' }) + ' ' + d.getFullYear(),
        items: [],
      };
      map.set(key, g);
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}
