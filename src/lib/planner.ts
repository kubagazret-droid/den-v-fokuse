export type Kind = "goal" | "task";
export type Item = { id: string; kind: Kind; text: string; time?: string; done: boolean; notified?: boolean };
export type Store = Record<string, Item[]>;

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Сдвигает время "ЧЧ:ММ" на минуты; возвращает новое время и смещение в днях. */
export function shiftTime(time: string | undefined, minutes: number, now = new Date()) {
  const base = time ? time.split(":").map(Number) : [now.getHours(), now.getMinutes()];
  const total = (base[0] ?? 0) * 60 + (base[1] ?? 0) + minutes;
  const dayOffset = Math.floor(total / 1440);
  const m = ((total % 1440) + 1440) % 1440;
  return { time: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, dayOffset };
}
