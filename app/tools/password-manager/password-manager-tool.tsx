"use client";

import { useEffect, useMemo, useState } from "react";

interface PasswordItem {
  id: string;
  name: string;
  account: string;
  password: string;
  category: string;
  note: string;
}

const STORAGE_KEY = "web-for-myself-password-manager";

function loadItems() {
  if (typeof window === "undefined") return [] as PasswordItem[];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PasswordItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function strengthLevel(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return "弱";
  if (score <= 4) return "中";
  return "强";
}

function generatePassword(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((n) => chars[n % chars.length])
    .join("");
}

export function PasswordManagerTool() {
  const [items, setItems] = useState<PasswordItem[]>(() => loadItems());
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("工作");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [showId, setShowId] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => `${item.name} ${item.account} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  function addItem() {
    if (!name.trim() || !account.trim() || !password) return;
    const next: PasswordItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name: name.trim(),
      account: account.trim(),
      password,
      category,
      note: note.trim(),
    };
    setItems((current) => [next, ...current]);
    setName("");
    setAccount("");
    setPassword("");
    setNote("");
  }

  function shareMasked(item: PasswordItem) {
    const payload = `${item.name}\n账号: ${item.account}\n密码: ${"*".repeat(Math.min(8, item.password.length))}\n分类: ${item.category}`;
    navigator.clipboard.writeText(payload);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">新增密码</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="平台名称" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="账号" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <button type="button" onClick={() => setPassword(generatePassword(16))} className="rounded-full border border-slate-300 px-3 py-2 text-xs">生成</button>
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option>工作</option><option>个人</option><option>金融</option><option>社交</option>
          </select>
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="备注" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <div className="flex items-center gap-3">
          <button type="button" onClick={addItem} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存</button>
          <span className="text-sm text-slate-600">强度：{strengthLevel(password)}</span>
        </div>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">密码库</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索平台/账号/分类" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.account} · {item.category}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowId((id) => (id === item.id ? "" : item.id))} className="rounded-full border border-slate-300 px-3 py-1 text-xs">显隐</button>
                  <button type="button" onClick={() => shareMasked(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs">安全分享</button>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-700">{showId === item.id ? item.password : "••••••••••"}</p>
              {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
            </li>
          ))}
          {filtered.length === 0 ? <li className="text-sm text-slate-400">暂无记录</li> : null}
        </ul>
      </article>
    </section>
  );
}
