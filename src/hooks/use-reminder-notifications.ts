import { useCallback, useEffect, useRef, useState } from "react";
import type { Item } from "@/lib/planner";

type Permission = NotificationPermission | "unsupported";

export function useReminderNotifications() {
  const [permission, setPermission] = useState<Permission>("default");
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const notifications = useRef(new Set<Notification>());

  useEffect(() => {
    const refresh = () => {
      const next = "Notification" in window ? Notification.permission : "unsupported";
      setPermission(next);
      if (next !== "granted") setEnabled(false);
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      notifications.current.forEach((notification) => notification.close());
      notifications.current.clear();
      if (audio.current) void audio.current.close().catch(() => {});
      audio.current = null;
    };
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) { setEnabled(false); return; }
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    // Unlock sound during the user's click, before awaiting the permission prompt.
    try {
      if (!audio.current && "AudioContext" in window) audio.current = new AudioContext();
      if (audio.current) void audio.current.resume().catch(() => {});
    } catch { /* Browser audio restrictions must not prevent reminders. */ }
    setRequesting(true);
    try {
      const next = Notification.permission === "default"
        ? await Notification.requestPermission() : Notification.permission;
      setPermission(next);
      setEnabled(next === "granted");
    } catch { setEnabled(false); }
    finally { setRequesting(false); }
  }, [enabled]);

  const notify = useCallback((item: Item, key: string) => {
    if (!enabled || !("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const notification = new Notification("Ежедневник — напоминание", {
        body: `${item.text}\n${key.split("-").reverse().join(".")} · ${item.time || "Без времени"}`,
        tag: `daily-notebook-${key}-${item.id}`,
        silent: true,
      });
      notifications.current.add(notification);
      notification.onclose = () => notifications.current.delete(notification);
      notification.onclick = () => { window.focus(); notification.close(); };
    } catch { /* The in-app reminder is always shown by the caller. */ }
    const context = audio.current;
    if (!context) return;
    const play = () => {
      if (context.state !== "running") return;
      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
      } catch { /* Audio is best-effort under browser/OS restrictions. */ }
    };
    if (context.state === "suspended") void context.resume().then(play).catch(() => {});
    else play();
  }, [enabled]);

  return { permission, enabled, requesting, toggle, notify };
}