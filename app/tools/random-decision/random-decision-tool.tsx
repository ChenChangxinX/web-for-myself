"use client";

import { useEffect, useMemo, useState } from "react";

type OptionItem = {
  id: string;
  label: string;
  weight: number;
};

type HistoryItem = {
  id: string;
  selected: string;
  at: string;
  snapshot: Array<{ label: string; weight: number }>;
};

const STORAGE_KEY = "web-for-myself-random-decision-history";

function pickWeighted(options: OptionItem[]) {
  const valid = options.filter((item) => item.label.trim() && item.weight > 0);
  const total = valid.reduce((sum, item) => sum + item.weight, 0);

  if (!valid.length || total <= 0) {
    return null;
  }

  let random = Math.random() * total;
  for (const item of valid) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  return valid[valid.length - 1];
}

function loadHistory() {
  if (typeof window === "undefined") {
    return [] as HistoryItem[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as HistoryItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item.selected === "string");
  } catch {
    return [];
  }
}

export function RandomDecisionTool() {
  const [options, setOptions] = useState<OptionItem[]>([
    { id: "1", label: "火锅", weight: 1 },
    { id: "2", label: "烧烤", weight: 1 },
    { id: "3", label: "日料", weight: 1 },
  ]);
  const [result, setResult] = useState("等待抽取结果");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status, setStatus] = useState("可开始随机决策");

  const totalWeight = useMemo(() => options.reduce((sum, item) => sum + Math.max(0, item.weight), 0), [options]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHistory(loadHistory()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  function addOption() {
    setOptions((current) => [...current, { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, label: "", weight: 1 }]);
  }

  function removeOption(id: string) {
    setOptions((current) => current.filter((item) => item.id !== id));
  }

  function updateOption(id: string, patch: Partial<OptionItem>) {
    setOptions((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function runDecision() {
    const selected = pickWeighted(options);

    if (!selected) {
      setStatus("请至少输入一个权重大于 0 的选项");
      return;
    }

    setResult(selected.label);
    setStatus("已完成随机决策");

    const entry: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      selected: selected.label,
      at: new Date().toISOString(),
      snapshot: options
        .filter((item) => item.label.trim())
        .map((item) => ({ label: item.label.trim(), weight: item.weight })),
    };

    setHistory((current) => [entry, ...current].slice(0, 30));
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">选项与权重</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addOption} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">添加选项</button>
            <button type="button" onClick={runDecision} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">随机选择</button>
          </div>
        </div>

        <div className="space-y-3">
          {options.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_120px_auto]">
              <input
                value={item.label}
                onChange={(event) => updateOption(item.id, { label: event.target.value })}
                placeholder="输入选项"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
              <input
                type="number"
                min={0}
                step={1}
                value={item.weight}
                onChange={(event) => updateOption(item.id, { weight: Math.max(0, Number(event.target.value) || 0) })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
              <button type="button" onClick={() => removeOption(item.id)} className="rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">删除</button>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-500">总权重：{totalWeight}，权重越高被选中的概率越大。</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">状态：{status}</p>
        <p className="mt-3 text-3xl font-extrabold text-slate-900">{result}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">历史记录</h2>
          <button type="button" onClick={() => setHistory([])} disabled={!history.length} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50">清空</button>
        </div>
        {history.length ? (
          <div className="space-y-3">
            {history.map((item) => (
              <article key={item.id} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">结果：{item.selected}</p>
                <p className="mt-1 text-xs text-slate-500">时间：{new Date(item.at).toLocaleString("zh-CN", { hour12: false })}</p>
                <p className="mt-1 text-xs text-slate-600">当时选项：{item.snapshot.map((snap) => `${snap.label}(${snap.weight})`).join("、")}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">暂无历史记录。</p>
        )}
      </div>
    </section>
  );
}
