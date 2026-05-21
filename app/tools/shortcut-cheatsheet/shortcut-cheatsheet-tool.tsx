"use client";

import { useEffect, useMemo, useState } from "react";

interface ShortcutItem {
  id: string;
  app: string;
  action: string;
  keys: string;
}

const defaultShortcuts: ShortcutItem[] = [
  { id: "vs-1", app: "VS Code", action: "命令面板", keys: "Ctrl+Shift+P" },
  { id: "vs-2", app: "VS Code", action: "全局搜索", keys: "Ctrl+Shift+F" },
  { id: "vs-3", app: "VS Code", action: "格式化文档", keys: "Shift+Alt+F" },
  { id: "chrome-1", app: "Chrome", action: "新建标签页", keys: "Ctrl+T" },
  { id: "chrome-2", app: "Chrome", action: "恢复关闭标签", keys: "Ctrl+Shift+T" },
  { id: "excel-1", app: "Excel", action: "求和", keys: "Alt+=" },
  { id: "excel-2", app: "Excel", action: "插入当前日期", keys: "Ctrl+;" },
  { id: "figma-1", app: "Figma", action: "框选工具", keys: "F" },
  { id: "figma-2", app: "Figma", action: "缩放到 100%", keys: "Shift+0" },
];

const LOCAL_STORAGE_KEY = "shortcut-cheatsheet-custom-items";

export function ShortcutCheatsheetTool() {
  const [search, setSearch] = useState("");
  const [appFilter, setAppFilter] = useState("全部");
  const [customItems, setCustomItems] = useState<ShortcutItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ShortcutItem[];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState({ app: "", action: "", keys: "" });
  const [practiceTarget, setPracticeTarget] = useState<ShortcutItem | null>(null);
  const [practiceInput, setPracticeInput] = useState("");
  const [practiceResult, setPracticeResult] = useState("");

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customItems));
  }, [customItems]);

  const allItems = useMemo(() => [...defaultShortcuts, ...customItems], [customItems]);
  const appOptions = useMemo(() => ["全部", ...Array.from(new Set(allItems.map((item) => item.app)))], [allItems]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return allItems.filter((item) => {
      const appMatch = appFilter === "全部" || item.app === appFilter;
      const keywordMatch =
        keyword.length === 0 ||
        item.app.toLowerCase().includes(keyword) ||
        item.action.toLowerCase().includes(keyword) ||
        item.keys.toLowerCase().includes(keyword);
      return appMatch && keywordMatch;
    });
  }, [allItems, appFilter, search]);

  function addCustomShortcut() {
    if (!form.app.trim() || !form.action.trim() || !form.keys.trim()) {
      return;
    }

    const next: ShortcutItem = {
      id: `custom-${Date.now()}`,
      app: form.app.trim(),
      action: form.action.trim(),
      keys: form.keys.trim(),
    };

    setCustomItems((current) => [next, ...current]);
    setForm({ app: "", action: "", keys: "" });
  }

  function startPractice() {
    if (filtered.length === 0) {
      setPracticeTarget(null);
      setPracticeResult("当前筛选下没有可练习条目");
      return;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    setPracticeTarget(filtered[randomIndex]);
    setPracticeInput("");
    setPracticeResult("");
  }

  function checkPractice() {
    if (!practiceTarget) {
      return;
    }

    const normalizedInput = practiceInput.replaceAll(" ", "").toLowerCase();
    const normalizedTarget = practiceTarget.keys.replaceAll(" ", "").toLowerCase();

    if (normalizedInput === normalizedTarget) {
      setPracticeResult("回答正确，继续下一题吧");
    } else {
      setPracticeResult(`不完全匹配，正确答案是 ${practiceTarget.keys}`);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">快捷键查询</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="搜索软件、功能、快捷键"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={appFilter}
            onChange={(event) => setAppFilter(event.target.value)}
          >
            {appOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">软件</th>
                <th className="px-3 py-2 text-left">功能</th>
                <th className="px-3 py-2 text-left">快捷键</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{item.app}</td>
                  <td className="px-3 py-2 text-slate-700">{item.action}</td>
                  <td className="px-3 py-2 font-mono text-slate-900">{item.keys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="space-y-6">
        <article className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">添加自定义快捷键</h2>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="软件名，例如 Photoshop"
            value={form.app}
            onChange={(event) => setForm((current) => ({ ...current, app: event.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="功能，例如 新建图层"
            value={form.action}
            onChange={(event) => setForm((current) => ({ ...current, action: event.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
            placeholder="快捷键，例如 Ctrl+Shift+N"
            value={form.keys}
            onChange={(event) => setForm((current) => ({ ...current, keys: event.target.value }))}
          />
          <button
            type="button"
            onClick={addCustomShortcut}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            保存
          </button>
        </article>

        <article className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">练习模式</h2>
          <button
            type="button"
            onClick={startPractice}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            随机出题
          </button>

          {practiceTarget ? (
            <>
              <p className="text-sm text-slate-700">
                {practiceTarget.app} - {practiceTarget.action}
              </p>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
                placeholder="输入你记得的快捷键"
                value={practiceInput}
                onChange={(event) => setPracticeInput(event.target.value)}
              />
              <button
                type="button"
                onClick={checkPractice}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                检查答案
              </button>
            </>
          ) : null}

          {practiceResult ? <p className="text-sm font-medium text-slate-700">{practiceResult}</p> : null}
        </article>
      </div>
    </section>
  );
}
