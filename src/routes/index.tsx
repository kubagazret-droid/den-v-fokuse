import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, Bell, Trash2, X, Plus } from "lucide-react";
import { dateKey, shiftTime, type Item, type Kind, type Store } from "@/lib/planner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ежедневник — цели и задачи на каждый день" },
      { name: "description", content: "Простой ежедневный блокнот: главные цели, задачи, напоминания и перенос задач." },
      { property: "og:title", content: "Ежедневник — цели и задачи" },
      { property: "og:description", content: "Планируйте день: цели, задачи и напоминания прямо в браузере." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const KEY = "daily-notebook-v1";
const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WD = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function Index() {
  const [store, setStore] = useState<Store>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState(() => new Date());
  const [postpone, setPostpone] = useState<{ key: string; item: Item } | null>(null);
  const [alerts, setAlerts] = useState<Item[]>([]);

  useEffect(() => {
    try { setStore(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* ignore */ }
    const now = new Date(); setSelected(now); setView(now); setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(store)); }, [store, loaded]);

  // напоминания
  useEffect(() => {
    if (!loaded) return;
    const tick = () => {
      const now = new Date(); const k = dateKey(now);
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const due = (store[k] || []).filter((i) => i.time && !i.done && !i.notified && i.time <= hm);
      if (!due.length) return;
      setAlerts((a) => [...a, ...due]);
      setStore((s) => ({ ...s, [k]: (s[k] || []).map((i) => (due.some((d) => d.id === i.id) ? { ...i, notified: true } : i)) }));
    };
    tick(); const t = setInterval(tick, 15000); return () => clearInterval(t);
  }, [store, loaded]);

  const key = dateKey(selected);
  const items = store[key] || [];
  const update = (k: string, fn: (l: Item[]) => Item[]) => setStore((s) => ({ ...s, [k]: fn(s[k] || []) }));

  const doPostpone = (minutes: number) => {
    if (!postpone || minutes <= 0) return;
    const { key: k, item } = postpone;
    const { time, dayOffset } = shiftTime(item.time, minutes);
    const moved = { ...item, time, notified: false };
    if (dayOffset === 0) update(k, (l) => l.map((i) => (i.id === item.id ? moved : i)));
    else {
      const [y, m, d] = k.split("-").map(Number);
      const nk = dateKey(new Date(y!, m! - 1, d! + dayOffset));
      setStore((s) => ({ ...s, [k]: (s[k] || []).filter((i) => i.id !== item.id), [nk]: [...(s[nk] || []), moved] }));
    }
    setPostpone(null);
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-5 font-sans">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Ежедневник</h1>
      <CalendarBar view={view} setView={setView} selected={selected} setSelected={setSelected} store={store} />
      <p className="mb-3 mt-6 text-sm text-muted-foreground">
        {selected.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <div className="space-y-4">
        {(["goal", "task"] as Kind[]).map((kind) => (
          <Section key={kind} kind={kind} items={items.filter((i) => i.kind === kind)}
            onAdd={(text, time) => update(key, (l) => [...l, { id: uid(), kind, text, ...(time ? { time } : {}), done: false }])}
            onToggle={(id) => update(key, (l) => l.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))}
            onDelete={(id) => update(key, (l) => l.filter((i) => i.id !== id))}
            onPostpone={(item) => setPostpone({ key, item })} />
        ))}
      </div>

      {postpone && <PostponeDialog item={postpone.item} onClose={() => setPostpone(null)} onSave={doPostpone} />}

      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 mx-auto flex max-w-xl flex-col gap-2 px-4">
        {alerts.map((a) => (
          <div key={a.id} className="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-xl border border-primary/40 bg-popover p-3 shadow-glow">
            <Bell className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Напоминание · {a.time}</p>
              <p className="truncate font-medium">{a.text}</p>
            </div>
            <button aria-label="Закрыть" onClick={() => setAlerts((l) => l.filter((x) => x.id !== a.id))}
              className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </main>
  );
}

function CalendarBar({ view, setView, selected, setSelected, store }: {
  view: Date; setView: (d: Date) => void; selected: Date; setSelected: (d: Date) => void; store: Store;
}) {
  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const pad = (first.getDay() + 6) % 7;
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return [...Array(pad).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))] as (Date | null)[];
  }, [view]);
  const today = dateKey(new Date()); const sel = dateKey(selected);
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <button aria-label="Предыдущий месяц" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="grid size-11 place-items-center rounded-xl bg-secondary hover:bg-accent"><ChevronLeft className="size-5" /></button>
        <h2 className="text-lg font-semibold">{MONTHS[view.getMonth()]} {view.getFullYear()}</h2>
        <button aria-label="Следующий месяц" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className="grid size-11 place-items-center rounded-xl bg-secondary hover:bg-accent"><ChevronRight className="size-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WD.map((w) => <div key={w} className="pb-1 text-xs text-muted-foreground">{w}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = dateKey(d); const has = (store[k] || []).length > 0;
          const isSel = k === sel; const isToday = k === today;
          return (
            <button key={k} onClick={() => setSelected(d)}
              className={`relative aspect-square min-h-10 rounded-xl text-sm font-medium transition-colors ${isSel ? "bg-primary text-primary-foreground shadow-glow" : isToday ? "bg-accent text-primary" : "hover:bg-secondary"}`}>
              {d.getDate()}
              {has && <span className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${isSel ? "bg-primary-foreground" : "bg-primary"}`} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Section({ kind, items, onAdd, onToggle, onDelete, onPostpone }: {
  kind: Kind; items: Item[]; onAdd: (t: string, time?: string) => void; onToggle: (id: string) => void;
  onDelete: (id: string) => void; onPostpone: (i: Item) => void;
}) {
  const [text, setText] = useState(""); const [time, setTime] = useState("");
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!text.trim()) return; onAdd(text.trim(), time || undefined); setText(""); setTime(""); };
  const sorted = [...items].sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="size-2 rounded-full bg-primary" />{kind === "goal" ? "Главные цели" : "Задачи"}
        <span className="ml-auto text-xs font-normal text-muted-foreground">{items.filter((i) => i.done).length}/{items.length}</span>
      </h3>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "goal" ? "Новая цель…" : "Новая задача…"}
          className="h-12 min-w-0 flex-1 basis-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary sm:basis-0" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Время напоминания"
          className="h-12 flex-1 rounded-xl border border-input bg-background px-3 text-base outline-none [color-scheme:dark] focus:border-primary sm:flex-none" />
        <button className="flex h-12 items-center gap-1 rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-glow active:scale-95">
          <Plus className="size-4" />Добавить</button>
      </form>
      <ul className="mt-3 space-y-2">
        {sorted.length === 0 && <li className="py-3 text-center text-sm text-muted-foreground">Пока пусто</li>}
        {sorted.map((i) => (
          <li key={i.id} className={`flex items-center gap-2 rounded-xl bg-secondary p-2 transition-opacity ${i.done ? "opacity-50" : ""}`}>
            <button aria-label="Выполнено" onClick={() => onToggle(i.id)}
              className={`grid size-10 shrink-0 place-items-center rounded-lg border-2 ${i.done ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
              {i.done && <Check className="size-5" />}</button>
            <div className="min-w-0 flex-1">
              <p className={`break-words ${i.done ? "line-through" : ""}`}>{i.text}</p>
              {i.time && <p className="flex items-center gap-1 text-xs text-primary"><Clock className="size-3" />{i.time}</p>}
            </div>
            <button aria-label="Отложить" onClick={() => onPostpone(i)} className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-primary"><Clock className="size-5" /></button>
            <button aria-label="Удалить" onClick={() => onDelete(i.id)} className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 className="size-5" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostponeDialog({ item, onClose, onSave }: { item: Item; onClose: () => void; onSave: (m: number) => void }) {
  const [h, setH] = useState(0); const [m, setM] = useState(30);
  const field = "h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary";
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="animate-toast-in w-full max-w-sm rounded-2xl border border-border bg-popover p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h4 className="font-semibold">Отложить задачу</h4>
        <p className="mb-4 truncate text-sm text-muted-foreground">{item.text}{item.time ? ` · ${item.time}` : ""}</p>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[[15, "+15 мин"], [60, "+1 час"], [180, "+3 часа"]].map(([v, l]) => (
            <button key={v} onClick={() => onSave(v as number)} className="h-11 rounded-xl bg-secondary text-sm font-medium hover:bg-accent hover:text-primary">{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">Часы<input type="number" min={0} value={h} onChange={(e) => setH(Math.max(0, +e.target.value))} className={field} /></label>
          <label className="text-xs text-muted-foreground">Минуты<input type="number" min={0} max={59} value={m} onChange={(e) => setM(Math.max(0, +e.target.value))} className={field} /></label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="h-12 flex-1 rounded-xl bg-secondary font-medium">Отмена</button>
          <button onClick={() => onSave(h * 60 + m)} className="h-12 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
