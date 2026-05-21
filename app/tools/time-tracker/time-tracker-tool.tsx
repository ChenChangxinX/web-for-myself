"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SessionMode = "manual" | "auto";

interface TimeSession {
  id: string;
  task: string;
  dateKey: string;
  durationSec: number;
  mode: SessionMode;
  startedAt: string;
  endedAt: string;
}

const STORAGE_KEY = "web-for-myself-time-tracker";

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function loadSessions() {
  if (typeof window === "undefined") {
    return [] as TimeSession[];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as TimeSession[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item.task === "string" && typeof item.durationSec === "number");
  } catch {
    return [];
  }
}

export function TimeTrackerTool() {
  const [sessions, setSessions] = useState<TimeSession[]>(() => loadSessions());
  const [taskInput, setTaskInput] = useState("深度工作");
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [autoTracking, setAutoTracking] = useState(false);
  const [status, setStatus] = useState("等待开始记录");

  const manualStartRef = useRef<number | null>(null);
  const autoStartRef = useRef<number | null>(null);
  const taskRef = useRef(taskInput);

  useEffect(() => {
    taskRef.current = taskInput;
  }, [taskInput]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      if (manualStartRef.current) {
        const next = Math.floor((Date.now() - manualStartRef.current) / 1000);
        setElapsedSec(next);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!autoTracking) {
      autoStartRef.current = null;
      return;
    }

    const startAuto = () => {
      if (document.visibilityState === "visible" && !autoStartRef.current) {
        autoStartRef.current = Date.now();
      }
    };

    const stopAuto = () => {
      if (!autoStartRef.current) {
        return;
      }
      const duration = Math.floor((Date.now() - autoStartRef.current) / 1000);
      autoStartRef.current = null;
      if (duration < 15) {
        return;
      }

      const end = new Date();
      const session: TimeSession = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
        task: taskRef.current.trim() || "未命名任务",
        dateKey: toDateKey(end),
        durationSec: duration,
        mode: "auto",
        startedAt: new Date(end.getTime() - duration * 1000).toISOString(),
        endedAt: end.toISOString(),
      };
      setSessions((current) => [session, ...current].slice(0, 800));
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopAuto();
      } else {
        startAuto();
      }
    };

    startAuto();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", stopAuto);
    window.addEventListener("focus", startAuto);

    return () => {
      stopAuto();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", stopAuto);
      window.removeEventListener("focus", startAuto);
    };
  }, [autoTracking]);

  function startManual() {
    if (running) {
      return;
    }
    manualStartRef.current = Date.now();
    setElapsedSec(0);
    setRunning(true);
    setStatus("手动计时中...");
  }

  function stopManual() {
    if (!running || !manualStartRef.current) {
      return;
    }
    const end = new Date();
    const duration = Math.max(1, Math.floor((Date.now() - manualStartRef.current) / 1000));
    const session: TimeSession = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      task: taskInput.trim() || "未命名任务",
      dateKey: toDateKey(end),
      durationSec: duration,
      mode: "manual",
      startedAt: new Date(manualStartRef.current).toISOString(),
      endedAt: end.toISOString(),
    };

    setSessions((current) => [session, ...current].slice(0, 800));
    manualStartRef.current = null;
    setRunning(false);
    setElapsedSec(0);
    setStatus("已记录一次手动追踪");
  }

  const todayKey = toDateKey(new Date());

  const report = useMemo(() => {
    const todaySessions = sessions.filter((item) => item.dateKey === todayKey);
    const todayTotal = todaySessions.reduce((sum, item) => sum + item.durationSec, 0);

    const taskMap = new Map<string, number>();
    todaySessions.forEach((item) => {
      taskMap.set(item.task, (taskMap.get(item.task) ?? 0) + item.durationSec);
    });

    const byTask = Array.from(taskMap.entries())
      .map(([task, sec]) => ({ task, sec }))
      .sort((a, b) => b.sec - a.sec)
      .slice(0, 6);

    const weekly = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - index);
      const key = toDateKey(day);
      const sec = sessions.filter((item) => item.dateKey === key).reduce((sum, item) => sum + item.durationSec, 0);
      return { key, sec };
    }).reverse();

    const monthlyMap = new Map<string, number>();
    sessions.forEach((item) => {
      const month = item.dateKey.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + item.durationSec);
    });

    const monthly = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, sec]) => ({ month, sec }));

    return { todayTotal, byTask, weekly, monthly };
  }, [sessions, todayKey]);

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">记录时间</h2>
          <input
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            placeholder="当前任务名称"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">手动计时</p>
            <p className="mt-2 font-mono text-4xl font-extrabold text-slate-900">{formatDuration(elapsedSec)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startManual}
              disabled={running}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              开始
            </button>
            <button
              type="button"
              onClick={stopManual}
              disabled={!running}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              停止并保存
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={autoTracking} onChange={(event) => setAutoTracking(event.target.checked)} />
            自动追踪（基于当前页面可见性）
          </label>

          <p className="text-sm text-slate-600">状态：{status}</p>
        </article>

        <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">今日分析</h2>
          <p className="text-sm text-slate-600">今日总投入：{formatDuration(report.todayTotal)}</p>
          <ul className="space-y-2">
            {report.byTask.map((item) => (
              <li key={item.task} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {item.task}：{formatDuration(item.sec)}
              </li>
            ))}
            {report.byTask.length === 0 ? <li className="text-sm text-slate-400">今天还没有记录。</li> : null}
          </ul>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">周报趋势（最近 7 天）</h3>
          <ul className="space-y-2">
            {report.weekly.map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-slate-500">{item.key}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(100, Math.round((item.sec / 14400) * 100))}%` }} />
                </div>
                <span className="w-20 text-right text-slate-700">{Math.round(item.sec / 60)} 分钟</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">月报趋势（最近 6 个月）</h3>
          <ul className="space-y-2">
            {report.monthly.map((item) => (
              <li key={item.month} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">{item.month}</span>
                <span className="font-semibold text-slate-800">{Math.round(item.sec / 3600)} 小时</span>
              </li>
            ))}
            {report.monthly.length === 0 ? <li className="text-sm text-slate-400">暂无月度数据</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}
