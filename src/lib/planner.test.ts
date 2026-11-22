import { describe, it, expect } from "vitest";
import { shiftTime } from "./planner";
describe("shiftTime", () => {
  it("+15 мин", () => expect(shiftTime("10:50", 15)).toEqual({ time: "11:05", dayOffset: 0 }));
  it("+3 часа через полночь переносит на следующий день", () =>
    expect(shiftTime("22:30", 180)).toEqual({ time: "01:30", dayOffset: 1 }));
});
