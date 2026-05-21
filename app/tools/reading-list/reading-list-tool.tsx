"use client";

import { useEffect, useMemo, useState } from "react";

type ReadingType = "book" | "article" | "webclip";
type ReadingStatus = "todo" | "reading" | "done";

interface ReadingItem {
  id: string;
  title: string;
  type: ReadingType;
  status: ReadingStatus;
  url?: string;
  notes: string;
  tags: string[];
  wordCount: number;
  createdAt: string;
}

const STORAGE_KEY = "web-for-myself-reading-list";

function parseTags(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 10);
}

function estimateMinutes(wordCount: number) {
  if (wordCount <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(wordCount / 300));
}

function loadItems() {
  if (typeof window === "undefined") {
    return [] as ReadingItem[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ReadingItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ReadingListTool() {
  const [items, setItems] = useState<ReadingItem[]>(() => loadItems());
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReadingType>("article");
  const [status, setStatus] = useState<ReadingStatus>("todo");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [wordCount, setWordCount] = useState(1200);

  const [clipTitle, setClipTitle] = useState("");
  const [clipUrl, setClipUrl] = useState("");
  const [clipExcerpt, setClipExcerpt] = useState("");
  const [clipTags, setClipTags] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const summary = useMemo(() => {
    const todo = items.filter((item) => item.status === "todo").length;
    const reading = items.filter((item) => item.status === "reading").length;
    const done = items.filter((item) => item.status === "done").length;
    const minutes = items.filter((item) => item.status !== "done").reduce((sum, item) => sum + estimateMinutes(item.wordCount), 0);
    return { todo, reading, done, minutes };
  }, [items]);

  function addItem() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }
    const next: ReadingItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: nextTitle,
      type,
      status,
      url: url.trim() || undefined,
      notes: notes.trim(),
      tags: parseTags(tagsInput),
      wordCount: Number.isFinite(wordCount) ? Math.max(0, Math.floor(wordCount)) : 0,
      createdAt: new Date().toISOString(),
    };
    setItems((current) => [next, ...current]);
    setTitle("");
    setUrl("");
    setNotes("");
    setTagsInput("");
    setWordCount(1200);
  }

  function addWebClip() {
    const nextTitle = clipTitle.trim() || clipUrl.trim();
    if (!nextTitle) {
      return;
    }
    const next: ReadingItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: nextTitle,
      type: "webclip",
      status: "todo",
      url: clipUrl.trim() || undefined,
      notes: clipExcerpt.trim(),
      tags: parseTags(clipTags),
      wordCount: Math.max(0, clipExcerpt.trim().length * 2),
      createdAt: new Date().toISOString(),
    };
    setItems((current) => [next, ...current]);
    setClipTitle("");
    setClipUrl("");
    setClipExcerpt("");
    setClipTags("");
  }

  async function pasteClipboardUrl() {
    try {
      if (!navigator.clipboard) {
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text.startsWith("http://") || text.startsWith("https://")) {
        setClipUrl(text);
      }
    } catch {
      // ignore clipboard permission errors
    }
  }

  function updateStatus(id: string, nextStatus: ReadingStatus) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">待读</p><p className="text-2xl font-extrabold text-slate-900">{summary.todo}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">阅读中</p><p className="text-2xl font-extrabold text-slate-900">{summary.reading}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">已完成</p><p className="text-2xl font-extrabold text-slate-900">{summary.done}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">预计剩余</p><p className="text-2xl font-extrabold text-slate-900">{summary.minutes} 分钟</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">新增阅读项</h2>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="标题" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={type} onChange={(event) => setType(event.target.value as ReadingType)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option value="article">文章</option>
              <option value="book">书籍</option>
              <option value="webclip">网页剪藏</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as ReadingStatus)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option value="todo">待读</option>
              <option value="reading">阅读中</option>
              <option value="done">已完成</option>
            </select>
          </div>
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="链接（可选）" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="笔记" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="标签，用逗号分隔" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <input
              type="number"
              min={0}
              value={wordCount}
              onChange={(event) => setWordCount(Number(event.target.value))}
              placeholder="字数"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>
          <button type="button" onClick={addItem} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white">添加阅读项</button>
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">网页剪藏</h2>
          <input value={clipTitle} onChange={(event) => setClipTitle(event.target.value)} placeholder="网页标题" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input value={clipUrl} onChange={(event) => setClipUrl(event.target.value)} placeholder="网页链接" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <button type="button" onClick={pasteClipboardUrl} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">粘贴链接</button>
          </div>
          <textarea value={clipExcerpt} onChange={(event) => setClipExcerpt(event.target.value)} placeholder="摘录内容" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={clipTags} onChange={(event) => setClipTags(event.target.value)} placeholder="标签，用逗号分隔" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button type="button" onClick={addWebClip} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存剪藏</button>
        </article>
      </div>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">我的阅读列表</h3>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.type} · 预计 {estimateMinutes(item.wordCount)} 分钟</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as ReadingStatus)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                    <option value="todo">待读</option>
                    <option value="reading">阅读中</option>
                    <option value="done">已完成</option>
                  </select>
                  <button type="button" onClick={() => removeItem(item.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600">删除</button>
                </div>
              </div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-sky-700 hover:text-sky-800">
                  打开链接
                </a>
              ) : null}
              {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <li key={`${item.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{tag}</li>
                ))}
              </ul>
            </li>
          ))}
          {items.length === 0 ? <li className="text-sm text-slate-400">还没有阅读条目，先添加一本书或一篇文章。</li> : null}
        </ul>
      </article>
    </section>
  );
}
