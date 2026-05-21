"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RepeatType = "none" | "daily" | "weekly" | "monthly";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  repeat: RepeatType;
  reminderMin: number;
  location: string;
  weatherNote: string;
  trafficNote: string;
}

const STORAGE_KEY = "web-for-myself-schedule-assistant";

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function occursOnDate(event: ScheduleEvent, dateKey: string) {
  if (event.date === dateKey) {
    return true;
  }
  if (event.repeat === "none" || dateKey < event.date) {
    return false;
  }

  const start = new Date(`${event.date}T00:00:00`);
  const target = new Date(`${dateKey}T00:00:00`);
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000);

  if (event.repeat === "daily") {
    return diffDays >= 0;
  }
  if (event.repeat === "weekly") {
    return diffDays >= 0 && diffDays % 7 === 0;
  }
  if (event.repeat === "monthly") {
    return target.getDate() === start.getDate() && target >= start;
  }
  return false;
}

function loadEvents() {
  if (typeof window === "undefined") {
    return [] as ScheduleEvent[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ScheduleEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nextMonth(date: Date, offset: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + offset, 1);
  return next;
}

export function ScheduleAssistantTool() {
  const [events, setEvents] = useState<ScheduleEvent[]>(() => loadEvents());
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [repeat, setRepeat] = useState<RepeatType>("none");
  const [reminderMin, setReminderMin] = useState(15);
  const [location, setLocation] = useState("");
  const [weatherNote, setWeatherNote] = useState("");
  const [trafficNote, setTrafficNote] = useState("");

  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const remindedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      return;
    }

    const timer = window.setInterval(() => {
      if (Notification.permission !== "granted") {
        return;
      }

      const now = new Date();
      const nowKey = toDateKey(now);
      events.forEach((event) => {
        if (!occursOnDate(event, nowKey)) {
          return;
        }

        const start = parseDateTime(nowKey, event.startTime);
        const diffMin = Math.floor((start.getTime() - now.getTime()) / 60000);
        const remindToken = `${event.id}-${nowKey}`;
        if (diffMin <= event.reminderMin && diffMin >= 0 && !remindedRef.current[remindToken]) {
          remindedRef.current[remindToken] = true;
          new Notification("日程提醒", {
            body: `${event.title} 将在 ${event.reminderMin} 分钟内开始`,
          });
        }
      });
    }, 30000);

    return () => window.clearInterval(timer);
  }, [events]);

  const monthDays = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const leading = first.getDay();
    const days = [] as Array<{ key: string; inMonth: boolean }>;

    for (let i = 0; i < leading; i += 1) {
      const day = new Date(first);
      day.setDate(day.getDate() - (leading - i));
      days.push({ key: toDateKey(day), inMonth: false });
    }

    for (let d = 1; d <= last.getDate(); d += 1) {
      const day = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d);
      days.push({ key: toDateKey(day), inMonth: true });
    }

    while (days.length % 7 !== 0) {
      const day = new Date(last);
      day.setDate(day.getDate() + (days.length % 7));
      days.push({ key: toDateKey(day), inMonth: false });
    }
    return days;
  }, [monthCursor]);

  const eventsOfSelectedDate = useMemo(() => {
    return events
      .filter((event) => occursOnDate(event, selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDate]);

  const suggestion = useMemo(() => {
    if (events.length === 0) {
      return "建议先记录一周行程，系统会基于历史自动给出时间建议。";
    }

    const hourCount = new Array<number>(24).fill(0);
    events.forEach((event) => {
      const hour = Number(event.startTime.split(":")[0]);
      if (Number.isFinite(hour) && hour >= 0 && hour < 24) {
        hourCount[hour] += 1;
      }
    });

    let leastHour = 9;
    for (let hour = 8; hour <= 20; hour += 1) {
      if (hourCount[hour] < hourCount[leastHour]) {
        leastHour = hour;
      }
    }

    const currentDayTraffic = eventsOfSelectedDate.map((event) => event.trafficNote).join(" ");
    const trafficBusy = /堵|拥挤|慢/.test(currentDayTraffic);
    const trafficAdvice = trafficBusy ? "交通较拥堵，建议比平时提前 20 分钟出发。" : "当前交通备注较平稳，可按常规时间出发。";
    return `根据历史安排，${String(leastHour).padStart(2, "0")}:00 左右最空闲，适合安排高优先任务。${trafficAdvice}`;
  }, [events, eventsOfSelectedDate]);

  function addEvent() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }
    const next: ScheduleEvent = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: nextTitle,
      date,
      startTime,
      endTime,
      repeat,
      reminderMin: Math.max(0, reminderMin),
      location: location.trim(),
      weatherNote: weatherNote.trim(),
      trafficNote: trafficNote.trim(),
    };
    setEvents((current) => [next, ...current]);
    setTitle("");
    setLocation("");
    setWeatherNote("");
    setTrafficNote("");
  }

  function deleteEvent(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id));
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

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">新增日程</h2>
          <button type="button" onClick={enableNotification} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">开启提醒权限</button>
        </div>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="事件名称" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <div className="grid gap-3 md:grid-cols-3">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select value={repeat} onChange={(event) => setRepeat(event.target.value as RepeatType)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="none">不重复</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
          <input
            type="number"
            min={0}
            value={reminderMin}
            onChange={(event) => setReminderMin(Number(event.target.value))}
            placeholder="提前提醒（分钟）"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="地点（可选）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={weatherNote} onChange={(event) => setWeatherNote(event.target.value)} placeholder="天气信息（如：小雨 22°C）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={trafficNote} onChange={(event) => setTrafficNote(event.target.value)} placeholder="交通信息（如：高峰拥堵）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={addEvent} className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">添加日程</button>
      </article>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">日历视图</h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setMonthCursor((prev) => nextMonth(prev, -1))} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">上月</button>
              <span className="text-sm font-semibold text-slate-700">{monthCursor.getFullYear()}-{String(monthCursor.getMonth() + 1).padStart(2, "0")}</span>
              <button type="button" onClick={() => setMonthCursor((prev) => nextMonth(prev, 1))} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">下月</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const count = events.filter((event) => occursOnDate(event, day.key)).length;
              const selected = day.key === selectedDate;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDate(day.key)}
                  className={`rounded-xl border px-2 py-2 text-left text-xs ${selected ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-white"} ${day.inMonth ? "text-slate-700" : "text-slate-400"}`}
                >
                  <p>{day.key.slice(8)}</p>
                  {count > 0 ? <p className="mt-1 text-[10px] text-cyan-700">{count} 项</p> : null}
                </button>
              );
            })}
          </div>
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">智能建议</h3>
          <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{suggestion}</p>
          <div className="space-y-2 text-xs text-slate-500">
            <p>天气查询：<a href="https://www.weather.com/" target="_blank" rel="noreferrer" className="font-semibold text-sky-700">weather.com</a></p>
            <p>交通查询：<a href="https://maps.google.com/" target="_blank" rel="noreferrer" className="font-semibold text-sky-700">Google Maps</a></p>
          </div>
        </article>
      </div>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">{selectedDate} 的日程</h3>
        <ul className="space-y-2">
          {eventsOfSelectedDate.map((event) => (
            <li key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{event.title}</p>
                <button type="button" onClick={() => deleteEvent(event.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">删除</button>
              </div>
              <p className="mt-1 text-slate-600">{event.startTime} - {event.endTime} · {event.repeat === "none" ? "不重复" : event.repeat}</p>
              {event.location ? <p className="mt-1 text-xs text-slate-500">地点：{event.location}</p> : null}
              {event.weatherNote ? <p className="mt-1 text-xs text-slate-500">天气：{event.weatherNote}</p> : null}
              {event.trafficNote ? <p className="mt-1 text-xs text-slate-500">交通：{event.trafficNote}</p> : null}
            </li>
          ))}
          {eventsOfSelectedDate.length === 0 ? <li className="text-sm text-slate-400">当天暂无日程。</li> : null}
        </ul>
      </article>
    </section>
  );
}
