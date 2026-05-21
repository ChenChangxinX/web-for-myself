"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface QuickNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

const STORAGE_KEY = "web-for-myself-quick-notes";

function loadNotes() {
  if (typeof window === "undefined") {
    return [] as QuickNote[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as QuickNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTags(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdown(input: string) {
  const escaped = escapeHtml(input);
  const lines = escaped.split("\n");
  const html = lines
    .map((line) => {
      if (line.startsWith("### ")) {
        return `<h3>${line.slice(4)}</h3>`;
      }
      if (line.startsWith("## ")) {
        return `<h2>${line.slice(3)}</h2>`;
      }
      if (line.startsWith("# ")) {
        return `<h1>${line.slice(2)}</h1>`;
      }
      const withBold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const withItalic = withBold.replace(/\*(.+?)\*/g, "<em>$1</em>");
      const withLink = withItalic.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
      return `<p>${withLink || "&nbsp;"}</p>`;
    })
    .join("");
  return html;
}

function extractWikiLinks(content: string) {
  const matches = content.match(/\[\[(.+?)\]\]/g) ?? [];
  return matches.map((item) => item.replace("[[", "").replace("]]", "").trim());
}

export function QuickNotesTool() {
  const [notes, setNotes] = useState<QuickNote[]>(() => loadNotes());
  const [activeId, setActiveId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("全部");

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        titleInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag)));
    return ["全部", ...Array.from(tags)];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const bySearch = `${note.title}\n${note.content}`.toLowerCase().includes(search.toLowerCase());
      const byTag = filterTag === "全部" || note.tags.includes(filterTag);
      return bySearch && byTag;
    });
  }, [notes, search, filterTag]);

  const activeNote = useMemo(() => notes.find((note) => note.id === activeId), [notes, activeId]);

  const backlinks = useMemo(() => {
    if (!activeNote) {
      return [] as QuickNote[];
    }
    return notes.filter((note) => extractWikiLinks(note.content).includes(activeNote.title));
  }, [notes, activeNote]);

  function saveNote() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }
    const nextTags = parseTags(tagsInput);
    if (activeId) {
      setNotes((current) =>
        current.map((note) =>
          note.id === activeId
            ? { ...note, title: nextTitle, content, tags: nextTags, updatedAt: new Date().toISOString() }
            : note,
        ),
      );
      return;
    }
    const next: QuickNote = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: nextTitle,
      content,
      tags: nextTags,
      updatedAt: new Date().toISOString(),
    };
    setNotes((current) => [next, ...current]);
    setActiveId(next.id);
  }

  function selectNote(note: QuickNote) {
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTagsInput(note.tags.join(", "));
  }

  function newNote() {
    setActiveId("");
    setTitle("");
    setContent("");
    setTagsInput("");
    titleInputRef.current?.focus();
  }

  function deleteNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id));
    if (activeId === id) {
      newNote();
    }
  }

  function exportCurrent() {
    const current = activeNote;
    if (!current) {
      return;
    }
    const payload = `# ${current.title}\n\n${current.content}\n\n---\n标签: ${current.tags.join(", ")}\n更新时间: ${current.updatedAt}`;
    const blob = new Blob([payload], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${current.title.replace(/[\\/:*?"<>|]/g, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索标题或内容..." className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <select value={filterTag} onChange={(event) => setFilterTag(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <button type="button" onClick={newNote} className="rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">新建笔记</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-900">笔记列表 ({filteredNotes.length})</h2>
          <ul className="space-y-2">
            {filteredNotes.map((note) => (
              <li key={note.id} className="rounded-xl border border-slate-200 p-3">
                <button type="button" onClick={() => selectNote(note)} className="w-full text-left">
                  <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(note.updatedAt).toLocaleString("zh-CN")}</p>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span key={`${note.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{tag}</span>
                  ))}
                </div>
                <button type="button" onClick={() => deleteNote(note.id)} className="mt-2 text-xs text-rose-600">删除</button>
              </li>
            ))}
            {filteredNotes.length === 0 ? <li className="text-sm text-slate-400">没有匹配的笔记</li> : null}
          </ul>
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">编辑器（Ctrl/Cmd + K 快速聚焦）</h2>
            <button type="button" onClick={exportCurrent} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">导出 MD</button>
          </div>
          <input ref={titleInputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="标题" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="标签，用逗号分隔" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={16} placeholder="支持 Markdown，也支持 [[笔记标题]] 双链。" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button type="button" onClick={saveNote} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存笔记</button>
          {activeNote ? (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">反向链接</p>
              <ul className="mt-1 space-y-1">
                {backlinks.map((note) => <li key={note.id}>{note.title}</li>)}
                {backlinks.length === 0 ? <li>暂无反向链接</li> : null}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Markdown 预览</h2>
          <div className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-slate-50 p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </article>
      </div>
    </section>
  );
}
