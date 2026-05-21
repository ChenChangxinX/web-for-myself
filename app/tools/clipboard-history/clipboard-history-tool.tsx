"use client";

import { useEffect, useMemo, useState } from "react";

interface ClipItem {
  id: string;
  text: string;
  favorite: boolean;
  createdAt: string;
}

const STORAGE_KEY = "web-for-myself-clipboard-history";

function loadItems() {
  if (typeof window === "undefined") return [] as ClipItem[];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClipItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatText(text: string, mode: "plain" | "upper" | "lower" | "single-line") {
  if (mode === "upper") return text.toUpperCase();
  if (mode === "lower") return text.toLowerCase();
  if (mode === "single-line") return text.replace(/\s+/g, " ").trim();
  return text;
}

export function ClipboardHistoryTool() {
  const [items, setItems] = useState<ClipItem[]>(() => loadItems());
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"plain" | "upper" | "lower" | "single-line">("plain");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => item.text.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  async function captureClipboard() {
    if (!navigator.clipboard) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      const next: ClipItem = { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, text, favorite: false, createdAt: new Date().toISOString() };
      setItems((current) => [next, ...current].slice(0, 300));
    } catch {
      // ignore
    }
  }

  function addManual() {
    if (!input.trim()) return;
    const next: ClipItem = { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, text: input, favorite: false, createdAt: new Date().toISOString() };
    setItems((current) => [next, ...current].slice(0, 300));
    setInput("");
  }

  async function copyItem(item: ClipItem) {
    const text = formatText(item.text, mode);
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">采集剪贴板</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={captureClipboard} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">读取系统剪贴板</button>
          <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="plain">原样复制</option>
            <option value="upper">转大写</option>
            <option value="lower">转小写</option>
            <option value="single-line">单行去格式</option>
          </select>
        </div>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="手动输入文本" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <button type="button" onClick={addManual} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">手动保存</button>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">历史记录</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文本" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-2 text-slate-700">{item.text}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setItems((current) => current.map((it) => it.id === item.id ? { ...it, favorite: !it.favorite } : it))} className="rounded-full border border-slate-300 px-3 py-1 text-xs">{item.favorite ? "取消收藏" : "收藏"}</button>
                  <button type="button" onClick={() => copyItem(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs">复制</button>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("zh-CN")}{item.favorite ? " · 已收藏" : ""}</p>
            </li>
          ))}
          {filtered.length === 0 ? <li className="text-sm text-slate-400">暂无记录</li> : null}
        </ul>
      </article>
    </section>
  );
}
