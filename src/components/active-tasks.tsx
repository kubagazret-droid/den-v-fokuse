import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeItems, type Store } from "@/lib/planner";

export function ActiveTasks({ store, onComplete, onDelete }: {
  store: Store;
  onComplete: (key: string, id: string) => void;
  onDelete: (key: string, id: string) => void;
}) {
  const active = activeItems(store);
  return (
    <section aria-label="Действующие задачи" className="min-w-0 rounded-2xl bg-card p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="size-2 rounded-full bg-primary" />Действующие задачи
        <span className="ml-auto text-xs font-normal text-muted-foreground">{active.length}</span>
      </h2>
      <ul className="space-y-2 lg:max-h-[32rem] lg:overflow-y-auto">
        {active.length === 0 && <li className="py-3 text-center text-sm text-muted-foreground">Пока пусто</li>}
        {active.map(({ key, item }) => (
          <li key={`${key}-${item.id}`} className="flex items-center gap-2 rounded-xl bg-secondary p-2">
            <Button variant="ghost" size="icon" aria-label="Отметить выполненной" title="Отметить выполненной"
              onClick={() => onComplete(key, item.id)}
              className="size-10 shrink-0 rounded-lg border-2 border-input text-muted-foreground hover:text-primary">
              <Check />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="break-words">{item.text}</p>
              <p className="mt-1 break-words text-xs text-muted-foreground">
                {item.kind === "goal" ? "Цель" : "Задача"} · {key.split("-").reverse().join(".")} · {item.time || "Без времени"}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Удалить" title="Удалить"
              onClick={() => onDelete(key, item.id)}
              className="size-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive">
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}