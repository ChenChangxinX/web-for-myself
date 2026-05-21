"use client";

import { useEffect, useMemo, useState } from "react";

interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  tags: string[];
}

interface ProfileVars {
  senderName: string;
  senderEmail: string;
  company: string;
}

interface MailStore {
  templates: MailTemplate[];
  profile: ProfileVars;
}

const STORAGE_KEY = "web-for-myself-mail-templates";

function parseTags(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

function loadStore(): MailStore {
  if (typeof window === "undefined") {
    return {
      templates: [],
      profile: { senderName: "", senderEmail: "", company: "" },
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        templates: [],
        profile: { senderName: "", senderEmail: "", company: "" },
      };
    }
    const parsed = JSON.parse(raw) as MailStore;
    return {
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      profile: parsed.profile ?? { senderName: "", senderEmail: "", company: "" },
    };
  } catch {
    return {
      templates: [],
      profile: { senderName: "", senderEmail: "", company: "" },
    };
  }
}

function replaceVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function MailTemplatesTool() {
  const [store, setStore] = useState<MailStore>(() => loadStore());
  const [activeId, setActiveId] = useState("");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("您好，{{recipientName}}");
  const [body, setBody] = useState("你好 {{recipientName}}，\n\n这是关于 {{topic}} 的跟进。\n\n{{senderName}}\n{{company}}");
  const [tagsInput, setTagsInput] = useState("");

  const [recipientName, setRecipientName] = useState("王同学");
  const [topic, setTopic] = useState("合作沟通");
  const [customVarsText, setCustomVarsText] = useState("meetingTime=明天 14:00");
  const [outputSubject, setOutputSubject] = useState("");
  const [outputBody, setOutputBody] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const vars = useMemo(() => {
    const now = new Date();
    const map: Record<string, string> = {
      recipientName,
      topic,
      senderName: store.profile.senderName,
      senderEmail: store.profile.senderEmail,
      company: store.profile.company,
      date: now.toLocaleDateString("zh-CN"),
      weekday: now.toLocaleDateString("zh-CN", { weekday: "long" }),
    };

    customVarsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes("="))
      .forEach((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim();
        if (key) {
          map[key] = value;
        }
      });
    return map;
  }, [recipientName, topic, store.profile, customVarsText]);

  function saveTemplate() {
    const nextName = name.trim();
    if (!nextName) {
      return;
    }

    const nextTemplate: MailTemplate = {
      id: activeId || `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name: nextName,
      subject,
      body,
      tags: parseTags(tagsInput),
    };

    setStore((current) => {
      const exists = current.templates.some((item) => item.id === nextTemplate.id);
      return {
        ...current,
        templates: exists
          ? current.templates.map((item) => (item.id === nextTemplate.id ? nextTemplate : item))
          : [nextTemplate, ...current.templates],
      };
    });
    setActiveId(nextTemplate.id);
  }

  function selectTemplate(template: MailTemplate) {
    setActiveId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setTagsInput(template.tags.join(", "));
  }

  function newTemplate() {
    setActiveId("");
    setName("");
    setSubject("您好，{{recipientName}}");
    setBody("你好 {{recipientName}}，\n\n这是关于 {{topic}} 的跟进。\n\n{{senderName}}\n{{company}}");
    setTagsInput("");
  }

  function removeTemplate(id: string) {
    setStore((current) => ({ ...current, templates: current.templates.filter((item) => item.id !== id) }));
    if (activeId === id) {
      newTemplate();
    }
  }

  function generateOutput() {
    setOutputSubject(replaceVars(subject, vars));
    setOutputBody(replaceVars(body, vars));
  }

  async function copyOutput() {
    const text = `Subject: ${outputSubject}\n\n${outputBody}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }

  function exportTemplates() {
    const blob = new Blob([JSON.stringify(store.templates, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mail-templates-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importTemplates(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as MailTemplate[];
        if (!Array.isArray(parsed)) {
          return;
        }
        setStore((current) => ({ ...current, templates: [...parsed, ...current.templates].slice(0, 200) }));
      } catch {
        // ignore invalid file
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">智能变量设置</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input value={store.profile.senderName} onChange={(event) => setStore((current) => ({ ...current, profile: { ...current.profile, senderName: event.target.value } }))} placeholder="发件人姓名" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={store.profile.senderEmail} onChange={(event) => setStore((current) => ({ ...current, profile: { ...current.profile, senderEmail: event.target.value } }))} placeholder="发件人邮箱" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={store.profile.company} onChange={(event) => setStore((current) => ({ ...current, profile: { ...current.profile, company: event.target.value } }))} placeholder="公司名" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">模板列表</h3>
            <button type="button" onClick={newTemplate} className="rounded-full border border-slate-300 px-3 py-1 text-xs">新建</button>
          </div>
          <ul className="space-y-2">
            {store.templates.map((template) => (
              <li key={template.id} className="rounded-xl border border-slate-200 p-3">
                <button type="button" onClick={() => selectTemplate(template)} className="w-full text-left">
                  <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500">{template.subject}</p>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.tags.map((tag) => <span key={`${template.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{tag}</span>)}
                </div>
                <button type="button" onClick={() => removeTemplate(template.id)} className="mt-2 text-xs text-rose-600">删除</button>
              </li>
            ))}
            {store.templates.length === 0 ? <li className="text-sm text-slate-400">暂无模板</li> : null}
          </ul>
          <div className="space-y-2 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">团队共享</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportTemplates} className="rounded-full border border-slate-300 px-3 py-1 text-xs">导出模板</button>
              <label className="rounded-full border border-slate-300 px-3 py-1 text-xs">
                导入模板
                <input type="file" accept="application/json" onChange={importTemplates} className="hidden" />
              </label>
            </div>
          </div>
        </article>

        <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">编辑与生成</h3>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="模板名称" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="邮件主题" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} placeholder="邮件正文，支持 {{recipientName}} 等变量" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="标签，用逗号分隔" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button type="button" onClick={saveTemplate} className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white">保存模板</button>

          <div className="grid gap-3 md:grid-cols-2">
            <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="recipientName" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="topic" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <textarea value={customVarsText} onChange={(event) => setCustomVarsText(event.target.value)} rows={4} placeholder="自定义变量，每行 key=value" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="button" onClick={generateOutput} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">生成邮件</button>
            <button type="button" onClick={copyOutput} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">复制结果</button>
          </div>

          <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-700">生成结果</p>
            <p className="text-sm font-semibold text-slate-900">{outputSubject || "(点击生成邮件)"}</p>
            <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{outputBody || ""}</pre>
          </div>
        </article>
      </div>
    </section>
  );
}
