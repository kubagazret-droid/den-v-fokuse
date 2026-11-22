import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReminderNotifications } from "./use-reminder-notifications";

afterEach(() => { vi.unstubAllGlobals(); });

const item = { id: "task", kind: "task" as const, text: "Позвонить", time: "14:00", done: false };

describe("browser reminders", () => {
  it("requests permission on opt-in, emits a dated notification and plays sound", async () => {
    const requestPermission = vi.fn(async () => "granted" as const);
    const createNotification = vi.fn();
    class MockNotification {
      static permission: NotificationPermission = "default";
      static requestPermission = requestPermission;
      close = vi.fn();
      constructor(title: string, options: NotificationOptions) { createNotification(title, options); }
    }
    const start = vi.fn();
    class MockAudio {
      state = "running";
      currentTime = 0;
      destination = {};
      resume = vi.fn(async () => {});
      close = vi.fn(async () => {});
      createOscillator = () => ({ frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), start, stop: vi.fn() });
      createGain = () => ({ gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() });
    }
    vi.stubGlobal("Notification", MockNotification);
    vi.stubGlobal("AudioContext", MockAudio);
    const { result } = renderHook(useReminderNotifications);
    expect(requestPermission).not.toHaveBeenCalled();
    await act(async () => { await result.current.toggle(); });
    MockNotification.permission = "granted";
    act(() => result.current.notify(item, "2026-11-22"));
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(createNotification).toHaveBeenCalledWith("Ежедневник — напоминание", {
      body: "Позвонить\n22.11.2026 · 14:00", tag: "daily-notebook-2026-11-22-task", silent: true,
    });
    expect(start).toHaveBeenCalledOnce();
    await act(async () => { await result.current.toggle(); });
    act(() => result.current.notify(item, "2026-11-22"));
    expect(createNotification).toHaveBeenCalledOnce();
  });

  it("does not attempt system notifications when permission is blocked", async () => {
    const construct = vi.fn();
    class BlockedNotification {
      static permission = "denied";
      constructor() { construct(); }
    }
    vi.stubGlobal("Notification", BlockedNotification);
    const { result } = renderHook(useReminderNotifications);
    await act(async () => { await result.current.toggle(); });
    act(() => result.current.notify(item, "2026-11-22"));
    expect(result.current.enabled).toBe(false);
    expect(result.current.permission).toBe("denied");
    expect(construct).not.toHaveBeenCalled();
  });
});