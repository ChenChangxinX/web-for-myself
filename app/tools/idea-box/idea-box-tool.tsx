"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type IdeaCategory = "产品" | "内容" | "增长" | "生活" | "其他";

interface IdeaItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  linkUrl: string;
  tags: string[];
  category: IdeaCategory;
  relatedIds: string[];
  createdAt: string;
}

const STORAGE_KEY = "web-for-myself-idea-box";

const keywordTagMap: Array<{ keyword: string; tag: string; category: IdeaCategory }> = [
  { keyword: "ai", tag: "AI", category: "产品" },
  { keyword: "自动化", tag: "自动化", category: "产品" },
  { keyword: "增长", tag: "增长", category: "增长" },
  { keyword: "运营", tag: "运营", category: "增长" },
  { keyword: "写作", tag: "写作", category: "内容" },
  { keyword: "视频", tag: "视频", category: "内容" },
  { keyword: "学习", tag: "学习", category: "生活" },
  { keyword: "习惯", tag: "习惯", category: "生活" },
];

function parseTags(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 10);
}

function loadIdeas() {
  if (typeof window === "undefined") {
    return [] as IdeaItem[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as IdeaItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function aiOrganize(title: string, content: string) {
  const text = `${title} ${content}`.toLowerCase();
  const tags = new Set<string>();
  let category: IdeaCategory = "其他";
  for (const item of keywordTagMap) {
    if (text.includes(item.keyword)) {
      tags.add(item.tag);
      category = item.category;
    }
  }
  if (tags.size === 0) {
    tags.add("待整理");
  }
  return { tags: Array.from(tags), category };
}

function relatedByTags(idea: IdeaItem, allIdeas: IdeaItem[]) {
  const source = new Set(idea.tags);
  return allIdeas
    .filter((item) => item.id !== idea.id)
    .map((item) => {
      const overlap = item.tags.filter((tag) => source.has(tag)).length;
      return { id: item.id, overlap };
    })
    .filter((item) => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((item) => item.id);
}

export function IdeaBoxTool() {
  const [ideas, setIdeas] = useState<IdeaItem[]>(() => loadIdeas());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("其他");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  const categoryCount = useMemo(() => {
    const counter: Record<IdeaCategory, number> = { 产品: 0, 内容: 0, 增长: 0, 生活: 0, 其他: 0 };
    ideas.forEach((item) => {
      counter[item.category] += 1;
    });
    return counter;
  }, [ideas]);

  function addIdea() {
    const nextTitle = title.trim();
    const nextContent = content.trim();
    if (!nextTitle && !nextContent) {
      return;
    }
    const next: IdeaItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: nextTitle || "未命名灵感",
      content: nextContent,
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim(),
      tags: parseTags(tagsInput),
      category,
      relatedIds: [],
      createdAt: new Date().toISOString(),
    };
    setIdeas((current) => [next, ...current]);
    setTitle("");
    setContent("");
    setImageUrl("");
    setLinkUrl("");
    setTagsInput("");
    setCategory("其他");
  }

  function runAiOrganize(id: string) {
    setIdeas((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        const result = aiOrganize(item.title, item.content);
        return {
          ...item,
          category: result.category,
          tags: Array.from(new Set([...item.tags, ...result.tags])),
        };
      }),
    );
  }

  function runAiOrganizeAll() {
    setIdeas((current) =>
      current.map((item) => {
        const result = aiOrganize(item.title, item.content);
        return {
          ...item,
          category: result.category,
          tags: Array.from(new Set([...item.tags, ...result.tags])),
        };
      }),
    );
  }

  function autoLinkIdeas(id: string) {
    setIdeas((current) => {
      const source = current.find((item) => item.id === id);
      if (!source) {
        return current;
      }
      const related = relatedByTags(source, current);
      return current.map((item) => (item.id === id ? { ...item, relatedIds: related } : item));
    });
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">总灵感</p><p className="text-2xl font-extrabold text-slate-900">{ideas.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">产品</p><p className="text-2xl font-extrabold text-slate-900">{categoryCount.产品}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">内容</p><p className="text-2xl font-extrabold text-slate-900">{categoryCount.内容}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">增长</p><p className="text-2xl font-extrabold text-slate-900">{categoryCount.增长}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">生活/其他</p><p className="text-2xl font-extrabold text-slate-900">{categoryCount.生活 + categoryCount.其他}</p></div>
      </div>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">记录灵感</h2>
          <button type="button" onClick={runAiOrganizeAll} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">AI 整理全部</button>
        </div>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="灵感标题" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="灵感内容" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="图片链接（可选）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="外部链接（可选）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="标签，用逗号分隔" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <select value={category} onChange={(event) => setCategory(event.target.value as IdeaCategory)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="产品">产品</option>
            <option value="内容">内容</option>
            <option value="增长">增长</option>
            <option value="生活">生活</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <button type="button" onClick={addIdea} className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white">添加灵感</button>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">灵感列表</h3>
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{idea.title}</p>
                  <p className="text-xs text-slate-500">{idea.category} · {new Date(idea.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => runAiOrganize(idea.id)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">AI 标签</button>
                  <button type="button" onClick={() => autoLinkIdeas(idea.id)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">发现关联</button>
                </div>
              </div>
              {idea.content ? <p className="mt-2 text-sm text-slate-700">{idea.content}</p> : null}
              {idea.imageUrl ? (
                <Image
                  src={idea.imageUrl}
                  alt={idea.title}
                  width={960}
                  height={420}
                  unoptimized
                  className="mt-3 max-h-52 w-full rounded-xl object-cover"
                />
              ) : null}
              {idea.linkUrl ? <a href={idea.linkUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-sky-700 hover:text-sky-800">打开链接</a> : null}
              <ul className="mt-2 flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <li key={`${idea.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{tag}</li>
                ))}
              </ul>
              {idea.relatedIds.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  关联灵感：
                  {idea.relatedIds
                    .map((id) => ideas.find((item) => item.id === id)?.title)
                    .filter((item): item is string => Boolean(item))
                    .join("、")}
                </p>
              ) : null}
            </li>
          ))}
          {ideas.length === 0 ? <li className="text-sm text-slate-400">暂无灵感，先记录一个想法。</li> : null}
        </ul>
      </article>
    </section>
  );
}
