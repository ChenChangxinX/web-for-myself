"use client";

import { useMemo, useState } from "react";

type Template = { name: string; pattern: string; flags: string; desc: string };

const templates: Template[] = [
  { name: "邮箱", pattern: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", flags: "", desc: "匹配常见邮箱地址" },
  { name: "手机号(中国)", pattern: "^1[3-9]\\d{9}$", flags: "", desc: "匹配 11 位中国手机号" },
  { name: "URL", pattern: "https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:\/?#[\\]@!$&'()*+,;=.]+", flags: "g", desc: "匹配 http/https 链接" },
  { name: "日期 YYYY-MM-DD", pattern: "^\\d{4}-\\d{2}-\\d{2}$", flags: "", desc: "匹配标准日期格式" },
  { name: "IPv4", pattern: "^(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$", flags: "", desc: "匹配 IPv4 地址" },
];

function escapeHtml(input: string) {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function explainPattern(pattern: string, flags: string) {
  const parts: string[] = [];
  if (flags.includes("i")) parts.push("忽略大小写");
  if (flags.includes("g")) parts.push("全局匹配");
  if (flags.includes("m")) parts.push("多行模式");
  if (/\^/.test(pattern)) parts.push("以指定内容开头");
  if (/\$/.test(pattern)) parts.push("以指定内容结尾");
  if (/\d/.test(pattern)) parts.push("包含数字匹配");
  if (/\w/.test(pattern)) parts.push("包含字母数字下划线匹配");
  if (/\s/.test(pattern)) parts.push("包含空白字符匹配");
  if (/\[.*\]/.test(pattern)) parts.push("使用字符集匹配");
  if (/\(.*\)/.test(pattern)) parts.push("使用分组匹配");
  if (/\|/.test(pattern)) parts.push("包含多选分支");
  if (/\{\d+,?\d*\}/.test(pattern)) parts.push("包含次数限定");

  if (!parts.length) {
    return "这是一个自定义正则表达式，用于匹配特定文本模式。";
  }

  return `该正则主要用于：${parts.join("、")}。`;
}

function buildRegexFromRequirement(requireDigits: boolean, requireLetters: boolean, minLength: number, allowSpace: boolean) {
  const classes: string[] = [];
  if (requireDigits) classes.push("(?=.*\\d)");
  if (requireLetters) classes.push("(?=.*[A-Za-z])");
  const body = allowSpace ? "." : "\\S";
  const length = Math.max(1, minLength);
  return `^${classes.join("")}${body}{${length},}$`;
}

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("\\b[A-Za-z]{4}\\b");
  const [flags, setFlags] = useState("g");
  const [sourceText, setSourceText] = useState("This is a test text with code and name like John and Lily.");
  const [status, setStatus] = useState("等待测试");

  const [requireDigits, setRequireDigits] = useState(true);
  const [requireLetters, setRequireLetters] = useState(true);
  const [allowSpace, setAllowSpace] = useState(false);
  const [minLength, setMinLength] = useState(8);

  const analysis = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(sourceText.matchAll(regex));

      let highlighted = "";
      let lastIndex = 0;

      matches.forEach((match) => {
        const index = match.index ?? 0;
        highlighted += escapeHtml(sourceText.slice(lastIndex, index));
        highlighted += `<mark class=\"rounded bg-violet-200/90 px-0.5\">${escapeHtml(match[0])}</mark>`;
        lastIndex = index + match[0].length;
      });
      highlighted += escapeHtml(sourceText.slice(lastIndex));

      return {
        ok: true,
        regex,
        matches,
        highlighted,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "正则表达式错误",
      };
    }
  }, [flags, pattern, sourceText]);

  const matchList = analysis.ok ? (analysis.matches ?? []) : [];

  function applyTemplate(template: Template) {
    setPattern(template.pattern);
    setFlags(template.flags);
    setStatus(`已应用模板：${template.name}`);
  }

  function generateByRequirement() {
    const generated = buildRegexFromRequirement(requireDigits, requireLetters, minLength, allowSpace);
    setPattern(generated);
    setFlags("");
    setStatus("已生成正则");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_120px]">
        <label className="text-sm text-slate-700">正则表达式<input value={pattern} onChange={(event) => setPattern(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm outline-none" /></label>
        <label className="text-sm text-slate-700">Flags<input value={flags} onChange={(event) => setFlags(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm outline-none" placeholder="gim" /></label>
      </div>

      <textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} className="min-h-44 w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm outline-none" />

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">状态：{status}</p>
        {analysis.ok ? (
          <>
            <p className="mt-2 text-sm text-slate-600">匹配数量：{matchList.length}</p>
            <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm leading-7 text-slate-800" dangerouslySetInnerHTML={{ __html: analysis.highlighted || escapeHtml(sourceText) }} />
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              {matchList.length ? matchList.map((match, index) => (
                <p key={`${match.index}-${index}`}>#{index + 1} - 值: {match[0]}，位置: {match.index}</p>
              )) : <p>暂无匹配</p>}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-rose-700">错误：{analysis.error}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">常用模板</h2>
          <div className="mt-3 space-y-2">
            {templates.map((template) => (
              <button key={template.name} type="button" onClick={() => applyTemplate(template)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
                <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                <p className="mt-1 text-xs text-slate-600">{template.desc}</p>
                <p className="mt-1 truncate font-mono text-xs text-slate-500">/{template.pattern}/{template.flags}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">正则解释</h2>
            <p className="mt-2 text-sm text-slate-700">{explainPattern(pattern, flags)}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">正则生成器</h2>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={requireDigits} onChange={() => setRequireDigits((v) => !v)} /> 必须包含数字</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={requireLetters} onChange={() => setRequireLetters((v) => !v)} /> 必须包含字母</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={allowSpace} onChange={() => setAllowSpace((v) => !v)} /> 允许空格</label>
              <label className="flex items-center gap-2">最小长度<input type="number" min={1} max={64} value={minLength} onChange={(event) => setMinLength(Number(event.target.value) || 1)} className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1" /></label>
            </div>
            <button type="button" onClick={generateByRequirement} className="mt-3 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white">生成正则</button>
          </div>
        </div>
      </div>
    </section>
  );
}
