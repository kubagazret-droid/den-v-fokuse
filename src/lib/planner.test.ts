import { describe, it, expect } from "vitest";
import { activeItems, shiftTime } from "./planner";
describe("shiftTime", () => {
  it("+15 мин", () => expect(shiftTime("10:50", 15)).toEqual({ time: "11:05", dayOffset: 0 }));
  it("+3 часа через полночь переносит на следующий день", () =>
    expect(shiftTime("22:30", 180)).toEqual({ time: "01:30", dayOffset: 1 }));
});

describe("activeItems", () => {
  it("includes unfinished goals and tasks from every date, excluding completed items", () => {
    const result = activeItems({
      "2026-11-22": [
        { id: "goal", kind: "goal", text: "Цель", time: "11:00", done: false },
        { id: "done", kind: "task", text: "Готово", done: true },
      ],
      "2026-11-21": [{ id: "past", kind: "task", text: "Вчера", done: false }],
      "2026-12-01": [{ id: "future", kind: "task", text: "Позже", time: "12:00", done: false }],
    });
    expect(result.map(({ key, item }) => [key, item.id, item.time])).toEqual([
      ["2026-11-21", "past", undefined],
      ["2026-11-22", "goal", "11:00"],
      ["2026-12-01", "future", "12:00"],
    ]);
  });
});
