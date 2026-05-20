"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownMode = "countdown" | "countup";

type CountdownItem = {
  id: string;
  title: string;
  targetDate: string;
  mode: CountdownMode;
  remindHoursBefore: number;
  lastNotifiedAt?: string;
};

const STORAGE_KEY = "web-for-myself-countdown-list";

function getDefaultTargetDate() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 16);
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}天 ${hours}时 ${minutes}分 ${seconds}秒`;
}

function loadItems() {
  if (typeof window === "undefined") {
    return [] as CountdownItem[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CountdownItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item.title && item.targetDate);
  } catch {
    return [];
  }
}

export function CountdownTool() {
  const [items, setItems] = useState<CountdownItem[]>([]);
  const [now, setNow] = useState(0);
  const [title, setTitle] = useState("高考");
  const [targetDate, setTargetDate] = useState(() => getDefaultTargetDate());
  const [mode, setMode] = useState<CountdownMode>("countdown");
  const [remindHoursBefore, setRemindHoursBefore] = useState(24);
  const [status, setStatus] = useState("等待添加");

  const enriched = useMemo(() => {
    return items.map((item) => {
      const targetMs = new Date(item.targetDate).getTime();
      const diff = item.mode === "countdown" ? targetMs - now : now - targetMs;
      return {
        ...item,
        targetMs,
        diff,
      };
    });
  }, [items, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(loadItems());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!items.length || typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    items.forEach((item) => {
      if (item.mode !== "countdown") {
        return;
      }

      const targetMs = new Date(item.targetDate).getTime();
      const remainMs = targetMs - now;
      const thresholdMs = item.remindHoursBefore * 3600 * 1000;
      const shouldNotify = remainMs > 0 && remainMs <= thresholdMs;

      if (!shouldNotify) {
        return;
      }

      const notificationKey = `${item.id}-${new Date(targetMs).toDateString()}`;
      if (item.lastNotifiedAt === notificationKey) {
        return;
      }

      if (Notification.permission === "granted") {
        new Notification(`提醒：${item.title}`, {
          body: `${item.title} 即将到期，剩余 ${formatDuration(remainMs)}`,
        });

        setItems((current) =>
          current.map((row) => (row.id === item.id ? { ...row, lastNotifiedAt: notificationKey } : row)),
        );
      }
    });
  }, [items, now]);

  async function enableNotification() {
    if (!("Notification" in window)) {
      setStatus("当前浏览器不支持通知");
      return;
    }

    const permission = await Notification.requestPermission();
    setStatus(permission === "granted" ? "通知已开启" : "通知未授权");
  }

  function addItem() {
    if (!title.trim() || !targetDate) {
      setStatus("请填写标题和目标时间");
      return;
    }

    const item: CountdownItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: title.trim(),
      targetDate,
      mode,
      remindHoursBefore,
    };

    setItems((current) => [item, ...current]);
    setStatus("已添加计时项目");
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto]">
        <label className="text-sm text-slate-700">标题<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></label>
        <label className="text-sm text-slate-700">目标时间<input type="datetime-local" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></label>
        <label className="text-sm text-slate-700">模式<select value={mode} onChange={(event) => setMode(event.target.value as CountdownMode)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option value="countdown">倒计时</option><option value="countup">正计时</option></select></label>
        <label className="text-sm text-slate-700">提醒(小时)<input type="number" min={1} max={720} value={remindHoursBefore} onChange={(event) => setRemindHoursBefore(Number(event.target.value) || 1)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></label>
        <div className="flex items-end"><button type="button" onClick={addItem} className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">添加</button></div>
        <div className="flex items-end"><button type="button" onClick={() => void enableNotification()} className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">开启提醒</button></div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p>状态：{status}</p>
        <p className="mt-1">支持多个倒计时和正计时。倒计时会在到期前按设置进行浏览器提醒（需授权通知）。</p>
      </div>

      {enriched.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {enriched.map((item) => {
            const isReached = item.mode === "countdown" ? item.diff <= 0 : false;
            return (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.mode === "countdown" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{item.mode === "countdown" ? "倒计时" : "正计时"}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">目标时间：{new Date(item.targetDate).toLocaleString("zh-CN", { hour12: false })}</p>
                <p className={`mt-2 text-lg font-bold ${isReached ? "text-rose-600" : "text-slate-900"}`}>{item.mode === "countdown" ? (isReached ? "已到期" : formatDuration(item.diff)) : formatDuration(item.diff)}</p>
                <button type="button" onClick={() => removeItem(item.id)} className="mt-3 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">删除</button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">还没有计时项目，先添加一个吧。</div>
      )}
    </section>
  );
}
