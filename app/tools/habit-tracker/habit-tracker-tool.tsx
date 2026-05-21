"use client";

import { useEffect, useMemo, useState } from "react";

interface HabitItem {
  id: string;
  name: string;
  color: string;
  reminderTime: string;
  completedDates: string[];
  createdAt: string;
}

interface CheckinItem {
  id: string;
  habitId: string;
  friend: string;
  message: string;
  createdAt: string;
}

interface HabitStore {
  habits: HabitItem[];
  checkins: CheckinItem[];
}

const STORAGE_KEY = "web-for-myself-habit-tracker";

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function loadStore(): HabitStore {
  if (typeof window === "undefined") {
    return { habits: [], checkins: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { habits: [], checkins: [] };
    }
    const parsed = JSON.parse(raw) as HabitStore;
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
    };
  } catch {
    return { habits: [], checkins: [] };
  }
}

function streak(dates: string[]) {
  if (dates.length === 0) {
    return 0;
  }
  const set = new Set(dates);
  let current = 0;
  const day = new Date();
  while (true) {
    const key = toDateKey(day);
    if (!set.has(key)) {
      break;
    }
    current += 1;
    day.setDate(day.getDate() - 1);
  }
  return current;
}

export function HabitTrackerTool() {
  const [store, setStore] = useState<HabitStore>(() => loadStore());
  const [habitName, setHabitName] = useState("");
  const [habitColor, setHabitColor] = useState("#059669");
  const [reminderTime, setReminderTime] = useState("20:00");

  const [friendName, setFriendName] = useState("");
  const [checkinMessage, setCheckinMessage] = useState("");
  const [checkinHabitId, setCheckinHabitId] = useState("");

  const todayKey = toDateKey(new Date());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      return;
    }

    const timer = window.setInterval(() => {
      if (Notification.permission !== "granted") {
        return;
      }
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      store.habits.forEach((habit) => {
        if (habit.reminderTime === time && !habit.completedDates.includes(todayKey)) {
          new Notification("习惯提醒", { body: `别忘了完成：${habit.name}` });
        }
      });
    }, 30000);

    return () => window.clearInterval(timer);
  }, [store.habits, todayKey]);

  const trend = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (13 - index));
      const key = toDateKey(day);
      const done = store.habits.reduce((count, item) => (item.completedDates.includes(key) ? count + 1 : count), 0);
      return { key, done };
    });
  }, [store.habits]);

  function addHabit() {
    const name = habitName.trim();
    if (!name) {
      return;
    }

    const next: HabitItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name,
      color: habitColor,
      reminderTime,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({ ...current, habits: [next, ...current.habits] }));
    setHabitName("");
    if (!checkinHabitId) {
      setCheckinHabitId(next.id);
    }
  }

  function toggleToday(habitId: string) {
    setStore((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }
        const hasDone = habit.completedDates.includes(todayKey);
        return {
          ...habit,
          completedDates: hasDone
            ? habit.completedDates.filter((item) => item !== todayKey)
            : [...habit.completedDates, todayKey].sort(),
        };
      }),
    }));
  }

  async function enableNotification() {
    if (typeof Notification === "undefined") {
      return;
    }
    if (Notification.permission === "granted") {
      return;
    }
    await Notification.requestPermission();
  }

  function addCheckin() {
    if (!checkinHabitId || !friendName.trim() || !checkinMessage.trim()) {
      return;
    }
    const item: CheckinItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      habitId: checkinHabitId,
      friend: friendName.trim(),
      message: checkinMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    setStore((current) => ({ ...current, checkins: [item, ...current.checkins].slice(0, 80) }));
    setCheckinMessage("");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">新增习惯</h2>
          <input
            value={habitName}
            onChange={(event) => setHabitName(event.target.value)}
            placeholder="例如：每天阅读 20 分钟"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              颜色
              <input type="color" value={habitColor} onChange={(event) => setHabitColor(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200" />
            </label>
            <label className="text-sm text-slate-600">
              提醒时间
              <input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addHabit} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              添加习惯
            </button>
            <button type="button" onClick={enableNotification} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              开启提醒权限
            </button>
          </div>
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">14 天完成曲线</h2>
          <ul className="space-y-2">
            {trend.map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-slate-500">{item.key.slice(5)}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, item.done * 25)}%` }} />
                </div>
                <span className="w-10 text-right text-slate-700">{item.done}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">习惯列表</h3>
        <ul className="space-y-3">
          {store.habits.map((habit) => {
            const doneToday = habit.completedDates.includes(todayKey);
            return (
              <li key={habit.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
                    <strong className="text-slate-900">{habit.name}</strong>
                  </div>
                  <p className="text-sm text-slate-600">连续 {streak(habit.completedDates)} 天</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleToday(habit.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${doneToday ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}
                  >
                    {doneToday ? "今日已完成" : "标记今日完成"}
                  </button>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600">提醒：{habit.reminderTime}</span>
                </div>
              </li>
            );
          })}
          {store.habits.length === 0 ? <li className="text-sm text-slate-400">还没有习惯，先添加一个开始打卡。</li> : null}
        </ul>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">伙伴打卡墙</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
          <select value={checkinHabitId} onChange={(event) => setCheckinHabitId(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="">选择习惯</option>
            {store.habits.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            value={friendName}
            onChange={(event) => setFriendName(event.target.value)}
            placeholder="伙伴昵称"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <input
            value={checkinMessage}
            onChange={(event) => setCheckinMessage(event.target.value)}
            placeholder="打卡留言"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <button type="button" onClick={addCheckin} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            发布
          </button>
        </div>
        <ul className="space-y-2">
          {store.checkins.map((item) => {
            const habit = store.habits.find((h) => h.id === item.habitId);
            return (
              <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <strong>{item.friend}</strong> 在 <strong>{habit?.name ?? "未知习惯"}</strong>：{item.message}
              </li>
            );
          })}
          {store.checkins.length === 0 ? <li className="text-sm text-slate-400">还没有伙伴动态。</li> : null}
        </ul>
      </article>
    </section>
  );
}
