"use client";

import { useEffect, useMemo, useState } from "react";

interface LaunchItem {
  id: string;
  name: string;
  url: string;
  shortcut: string;
  tags: string[];
}

interface Workspace {
  id: string;
  name: string;
  itemIds: string[];
}

interface Store {
  items: LaunchItem[];
  workspaces: Workspace[];
}

const STORAGE_KEY = "web-for-myself-quick-launcher";

function loadStore(): Store {
  if (typeof window === "undefined") return { items: [], workspaces: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], workspaces: [] };
    const parsed = JSON.parse(raw) as Store;
    return { items: parsed.items ?? [], workspaces: parsed.workspaces ?? [] };
  } catch {
    return { items: [], workspaces: [] };
  }
}

export function QuickLauncherTool() {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [shortcut, setShortcut] = useState("ctrl+1");
  const [tags, setTags] = useState("工作, 常用");
  const [search, setSearch] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = `${event.ctrlKey ? "ctrl+" : ""}${event.altKey ? "alt+" : ""}${event.shiftKey ? "shift+" : ""}${event.key.toLowerCase()}`;
      const target = store.items.find((item) => item.shortcut.toLowerCase() === key);
      if (target) {
        event.preventDefault();
        window.open(target.url, "_blank", "noopener,noreferrer");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store.items]);

  const filtered = useMemo(() => {
    return store.items.filter((item) => `${item.name} ${item.url} ${item.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  }, [store.items, search]);

  function addItem() {
    if (!name.trim() || !url.trim()) return;
    const next: LaunchItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name: name.trim(),
      url: url.trim(),
      shortcut: shortcut.trim(),
      tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
    };
    setStore((current) => ({ ...current, items: [next, ...current.items] }));
    setName("");
  }

  function openWorkspace(workspace: Workspace) {
    workspace.itemIds
      .map((id) => store.items.find((item) => item.id === id))
      .filter((item): item is LaunchItem => Boolean(item))
      .forEach((item) => window.open(item.url, "_blank", "noopener,noreferrer"));
  }

  function addWorkspace() {
    if (!workspaceName.trim() || selectedIds.length === 0) return;
    const next: Workspace = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name: workspaceName.trim(),
      itemIds: selectedIds,
    };
    setStore((current) => ({ ...current, workspaces: [next, ...current.workspaces] }));
    setWorkspaceName("");
    setSelectedIds([]);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">新增启动项</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={shortcut} onChange={(event) => setShortcut(event.target.value)} placeholder="快捷键，如 ctrl+1" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="标签" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={addItem} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存</button>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">快速搜索启动</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.shortcut}</p>
              </div>
              <button type="button" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")} className="rounded-full border border-slate-300 px-3 py-1 text-xs">打开</button>
            </li>
          ))}
        </ul>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">工作空间</h3>
        <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="工作空间名称" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <div className="grid gap-2 md:grid-cols-2">
          {store.items.map((item) => (
            <label key={item.id} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
              {item.name}
            </label>
          ))}
        </div>
        <button type="button" onClick={addWorkspace} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存工作空间</button>
        <ul className="space-y-2">
          {store.workspaces.map((workspace) => (
            <li key={workspace.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
              <span>{workspace.name} ({workspace.itemIds.length})</span>
              <button type="button" onClick={() => openWorkspace(workspace)} className="rounded-full border border-slate-300 px-3 py-1 text-xs">一键打开</button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
