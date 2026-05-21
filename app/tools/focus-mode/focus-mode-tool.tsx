"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface FocusStore {
  enabled: boolean;
  blocklist: string[];
  allowlist: string[];
  blockedCount: number;
  history: Array<{ id: string; url: string; at: string; blocked: boolean }>;
}

const STORAGE_KEY = "web-for-myself-focus-mode";

function loadStore(): FocusStore {
  if (typeof window === "undefined") {
    return { enabled: false, blocklist: [], allowlist: [], blockedCount: 0, history: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { enabled: false, blocklist: [], allowlist: [], blockedCount: 0, history: [] };
    }
    const parsed = JSON.parse(raw) as FocusStore;
    return {
      enabled: Boolean(parsed.enabled),
      blocklist: Array.isArray(parsed.blocklist) ? parsed.blocklist : [],
      allowlist: Array.isArray(parsed.allowlist) ? parsed.allowlist : [],
      blockedCount: typeof parsed.blockedCount === "number" ? parsed.blockedCount : 0,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { enabled: false, blocklist: [], allowlist: [], blockedCount: 0, history: [] };
  }
}

function normalizeHost(input: string) {
  const text = input.trim();
  if (!text) {
    return "";
  }
  try {
    const url = text.includes("://") ? new URL(text) : new URL(`https://${text}`);
    return url.hostname.toLowerCase();
  } catch {
    return text.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  }
}

function formatMmSs(totalSec: number) {
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function FocusModeTool() {
  const [store, setStore] = useState<FocusStore>(() => loadStore());
  const [domainInput, setDomainInput] = useState("");
  const [allowInput, setAllowInput] = useState("");
  const [testUrl, setTestUrl] = useState("https://www.youtube.com");
  const [message, setMessage] = useState("等待测试链接");

  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [leftSec, setLeftSec] = useState(25 * 60);
  const [autoFocus, setAutoFocus] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  const workMinRef = useRef(workMin);
  const breakMinRef = useRef(breakMin);

  useEffect(() => {
    workMinRef.current = workMin;
  }, [workMin]);

  useEffect(() => {
    breakMinRef.current = breakMin;
  }, [breakMin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (!pomodoroRunning) {
      return;
    }
    const timer = window.setInterval(() => {
      setLeftSec((current) => {
        if (current > 1) {
          return current - 1;
        }

        if (!isBreak) {
          setSessionCount((count) => count + 1);
          setIsBreak(true);
          if (autoFocus) {
            setStore((currentStore) => ({ ...currentStore, enabled: false }));
          }
          return breakMinRef.current * 60;
        }

        setIsBreak(false);
        if (autoFocus) {
          setStore((currentStore) => ({ ...currentStore, enabled: true }));
        }
        return workMinRef.current * 60;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [pomodoroRunning, isBreak, autoFocus]);

  const topBlocked = useMemo(() => {
    const counter = new Map<string, number>();
    store.history.forEach((item) => {
      if (item.blocked) {
        const host = normalizeHost(item.url);
        counter.set(host, (counter.get(host) ?? 0) + 1);
      }
    });
    return Array.from(counter.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [store.history]);

  function addBlockDomain() {
    const host = normalizeHost(domainInput);
    if (!host) {
      return;
    }
    setStore((current) => ({ ...current, blocklist: Array.from(new Set([...current.blocklist, host])) }));
    setDomainInput("");
  }

  function addAllowDomain() {
    const host = normalizeHost(allowInput);
    if (!host) {
      return;
    }
    setStore((current) => ({ ...current, allowlist: Array.from(new Set([...current.allowlist, host])) }));
    setAllowInput("");
  }

  function removeDomain(kind: "block" | "allow", host: string) {
    setStore((current) =>
      kind === "block"
        ? { ...current, blocklist: current.blocklist.filter((item) => item !== host) }
        : { ...current, allowlist: current.allowlist.filter((item) => item !== host) },
    );
  }

  function testAccess() {
    const host = normalizeHost(testUrl);
    if (!host) {
      return;
    }
    const inAllow = store.allowlist.some((item) => host.includes(item));
    const inBlock = store.blocklist.some((item) => host.includes(item));
    const blocked = store.enabled && inBlock && !inAllow;

    setStore((current) => ({
      ...current,
      blockedCount: blocked ? current.blockedCount + 1 : current.blockedCount,
      history: [
        { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, url: testUrl, at: new Date().toISOString(), blocked },
        ...current.history,
      ].slice(0, 100),
    }));

    setMessage(blocked ? `已拦截 ${host}` : `允许访问 ${host}`);
    if (!blocked) {
      window.open(testUrl, "_blank", "noopener,noreferrer");
    }
  }

  function startPomodoro() {
    setIsBreak(false);
    setLeftSec(workMin * 60);
    setPomodoroRunning(true);
    if (autoFocus) {
      setStore((current) => ({ ...current, enabled: true }));
    }
  }

  function stopPomodoro() {
    setPomodoroRunning(false);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">专注模式</p><p className="text-2xl font-extrabold text-slate-900">{store.enabled ? "开启" : "关闭"}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">黑名单</p><p className="text-2xl font-extrabold text-slate-900">{store.blocklist.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">白名单</p><p className="text-2xl font-extrabold text-slate-900">{store.allowlist.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">拦截次数</p><p className="text-2xl font-extrabold text-slate-900">{store.blockedCount}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">网站规则</h2>
            <button type="button" onClick={() => setStore((current) => ({ ...current, enabled: !current.enabled }))} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              {store.enabled ? "关闭专注" : "开启专注"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <input value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder="黑名单域名，如 youtube.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <button type="button" onClick={addBlockDomain} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">加入黑名单</button>
            </div>
            <div className="space-y-2">
              <input value={allowInput} onChange={(event) => setAllowInput(event.target.value)} placeholder="白名单域名，如 docs.google.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <button type="button" onClick={addAllowDomain} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">加入白名单</button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ul className="space-y-2 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">黑名单</p>
              {store.blocklist.map((host) => (
                <li key={host} className="flex items-center justify-between text-xs text-slate-700"><span>{host}</span><button type="button" onClick={() => removeDomain("block", host)} className="text-rose-600">移除</button></li>
              ))}
            </ul>
            <ul className="space-y-2 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">白名单</p>
              {store.allowlist.map((host) => (
                <li key={host} className="flex items-center justify-between text-xs text-slate-700"><span>{host}</span><button type="button" onClick={() => removeDomain("allow", host)} className="text-rose-600">移除</button></li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600">拦截测试</p>
            <div className="flex gap-2">
              <input value={testUrl} onChange={(event) => setTestUrl(event.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <button type="button" onClick={testAccess} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">测试访问</button>
            </div>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">番茄钟联动</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">{isBreak ? "休息中" : "专注中"}</p>
            <p className="mt-1 font-mono text-4xl font-extrabold text-slate-900">{formatMmSs(leftSec)}</p>
            <p className="mt-1 text-xs text-slate-500">已完成番茄钟 {sessionCount}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="number" min={1} value={workMin} onChange={(event) => setWorkMin(Math.max(1, Number(event.target.value)))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <input type="number" min={1} value={breakMin} onChange={(event) => setBreakMin(Math.max(1, Number(event.target.value)))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={autoFocus} onChange={(event) => setAutoFocus(event.target.checked)} />工作阶段自动开启专注模式</label>
          <div className="flex gap-2">
            <button type="button" onClick={startPomodoro} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">开始番茄钟</button>
            <button type="button" onClick={stopPomodoro} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">暂停</button>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">分心统计 Top</p>
            <ul className="mt-2 space-y-1">
              {topBlocked.map((item) => (
                <li key={item.host}>{item.host} · {item.count} 次</li>
              ))}
              {topBlocked.length === 0 ? <li>暂无拦截记录</li> : null}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
