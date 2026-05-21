"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "focus" | "break";

type SessionLog = {
  id: string;
  task: string;
  phase: "focus";
  durationMinutes: number;
  finishedAt: string;
};

const STORAGE_KEY = "web-for-myself-pomodoro-logs";

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function loadLogs() {
  if (typeof window === "undefined") {
    return [] as SessionLog[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SessionLog[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item.phase === "focus" && typeof item.finishedAt === "string");
  } catch {
    return [];
  }
}

export function PomodoroProTool() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase] = useState<Phase>("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskInput, setTaskInput] = useState("默认任务");
  const [status, setStatus] = useState("准备开始专注");
  const [logs, setLogs] = useState<SessionLog[]>([]);

  const phaseRef = useRef<Phase>(phase);
  const taskRef = useRef(taskInput);
  const lockRef = useRef(false);

  const todayKey = toDateKey(new Date());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    taskRef.current = taskInput;
  }, [taskInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLogs(loadLogs());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (!lockRef.current) {
            lockRef.current = true;
            window.setTimeout(() => {
              const nowPhase = phaseRef.current;

              if (nowPhase === "focus") {
                const duration = Math.max(1, focusMinutes);
                const logItem: SessionLog = {
                  id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                  task: taskRef.current.trim() || "未命名任务",
                  phase: "focus",
                  durationMinutes: duration,
                  finishedAt: new Date().toISOString(),
                };

                setLogs((current) => [
                  logItem,
                  ...current,
                ].slice(0, 400));
                setPhase("break");
                setRemainingSeconds(Math.max(1, breakMinutes) * 60);
                setStatus("专注结束，进入休息");
              } else {
                setPhase("focus");
                setRemainingSeconds(Math.max(1, focusMinutes) * 60);
                setStatus("休息结束，开始下一轮专注");
              }

              lockRef.current = false;
            }, 0);
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, focusMinutes, breakMinutes]);

  const todayLogs = useMemo(() => logs.filter((item) => item.finishedAt.slice(0, 10) === todayKey), [logs, todayKey]);

  const report = useMemo(() => {
    const totalPomodoros = todayLogs.length;
    const totalMinutes = todayLogs.reduce((sum, item) => sum + item.durationMinutes, 0);
    const byTask = new Map<string, number>();

    todayLogs.forEach((item) => {
      byTask.set(item.task, (byTask.get(item.task) ?? 0) + 1);
    });

    const taskRanking = Array.from(byTask.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      totalPomodoros,
      totalMinutes,
      taskRanking,
    };
  }, [todayLogs]);

  const recentDays = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - index);
      const key = toDateKey(day);
      const count = logs.filter((item) => item.finishedAt.slice(0, 10) === key).length;
      return { key, count };
    });

    return days;
  }, [logs]);

  function applyDurations() {
    const focus = Math.max(1, focusMinutes);
    const rest = Math.max(1, breakMinutes);

    setFocusMinutes(focus);
    setBreakMinutes(rest);
    setPhase("focus");
    setRemainingSeconds(focus * 60);
    setRunning(false);
    setStatus("已应用时长设置");
  }

  function resetCurrentRound() {
    const next = phase === "focus" ? focusMinutes : breakMinutes;
    setRemainingSeconds(Math.max(1, next) * 60);
    setRunning(false);
    setStatus("已重置当前阶段");
  }

  function skipPhase() {
    if (phase === "focus") {
      setPhase("break");
      setRemainingSeconds(Math.max(1, breakMinutes) * 60);
      setStatus("已跳过专注，进入休息");
    } else {
      setPhase("focus");
      setRemainingSeconds(Math.max(1, focusMinutes) * 60);
      setStatus("已跳过休息，进入专注");
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">计时器</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-700">
              专注时长（分钟）
              <input
                type="number"
                min={1}
                max={180}
                value={focusMinutes}
                onChange={(event) => setFocusMinutes(Number(event.target.value) || 1)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"
              />
            </label>
            <label className="text-sm text-slate-700">
              休息时长（分钟）
              <input
                type="number"
                min={1}
                max={60}
                value={breakMinutes}
                onChange={(event) => setBreakMinutes(Number(event.target.value) || 1)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"
              />
            </label>
          </div>

          <label className="block text-sm text-slate-700">
            当前任务
            <input
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder="例如：整理接口文档"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"
            />
          </label>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className={`text-sm font-semibold ${phase === "focus" ? "text-red-700" : "text-emerald-700"}`}>{phase === "focus" ? "专注阶段" : "休息阶段"}</p>
            <p className="mt-3 font-mono text-6xl font-extrabold tracking-tight text-slate-900">{formatClock(remainingSeconds)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRunning((v) => !v)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              {running ? "暂停" : "开始"}
            </button>
            <button type="button" onClick={resetCurrentRound} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">重置当前阶段</button>
            <button type="button" onClick={skipPhase} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">跳过阶段</button>
            <button type="button" onClick={applyDurations} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">应用时长</button>
          </div>

          <p className="text-sm text-slate-600">状态：{status}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-900">今日报告</h2>
            <p className="mt-2 text-sm text-slate-600">完成番茄：{report.totalPomodoros} 次</p>
            <p className="mt-1 text-sm text-slate-600">专注时长：{report.totalMinutes} 分钟</p>
            <div className="mt-3 space-y-2">
              {report.taskRanking.length ? report.taskRanking.map(([task, count]) => (
                <p key={task} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{task}：{count} 次</p>
              )) : <p className="text-sm text-slate-500">今天还没有完成专注轮次。</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-900">近 14 天记录</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recentDays.map((day) => (
                <p key={day.key} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{day.key}：{day.count} 次</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
