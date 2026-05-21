"use client";

import { useMemo, useState } from "react";

interface Rule {
  id: string;
  ext: string;
  target: string;
}

function typeFolder(file: File) {
  if (file.type.startsWith("image/")) return "Images";
  if (file.type.startsWith("video/")) return "Videos";
  if (file.type.startsWith("audio/")) return "Audio";
  if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) return "Docs";
  return "Others";
}

function extName(filename: string) {
  const index = filename.lastIndexOf(".");
  return index > -1 ? filename.slice(index + 1).toLowerCase() : "";
}

export function FileOrganizerTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleExt, setRuleExt] = useState("pdf");
  const [ruleTarget, setRuleTarget] = useState("Documents/PDF");

  const analysis = useMemo(() => {
    const groups = new Map<string, File[]>();
    const duplicates = new Map<string, File[]>();

    files.forEach((file) => {
      const ext = extName(file.name);
      const custom = rules.find((rule) => rule.ext === ext)?.target;
      const month = new Date(file.lastModified).toISOString().slice(0, 7);
      const folder = custom || `${typeFolder(file)}/${month}`;
      const list = groups.get(folder) ?? [];
      list.push(file);
      groups.set(folder, list);

      const dupKey = `${file.name}-${file.size}`;
      const dupList = duplicates.get(dupKey) ?? [];
      dupList.push(file);
      duplicates.set(dupKey, dupList);
    });

    return {
      groups: Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      duplicates: Array.from(duplicates.values()).filter((list) => list.length > 1),
    };
  }, [files, rules]);

  function addRule() {
    const ext = ruleExt.trim().toLowerCase();
    const target = ruleTarget.trim();
    if (!ext || !target) return;
    setRules((current) => [...current.filter((item) => item.ext !== ext), { id: `${Date.now()}`, ext, target }]);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">上传文件并分析</h2>
        <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <p className="text-sm text-slate-600">已选择 {files.length} 个文件。</p>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900">自定义规则</h3>
        <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
          <input value={ruleExt} onChange={(event) => setRuleExt(event.target.value)} placeholder="扩展名，如 pdf" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={ruleTarget} onChange={(event) => setRuleTarget(event.target.value)} placeholder="目标目录，如 Docs/PDF" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button type="button" onClick={addRule} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">添加规则</button>
        </div>
        <ul className="space-y-1 text-sm text-slate-600">
          {rules.map((rule) => <li key={rule.id}>.{rule.ext} {"->"} {rule.target}</li>)}
        </ul>
      </article>

      <article className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">智能分类结果</h3>
          <ul className="space-y-2 text-sm">
            {analysis.groups.map(([folder, groupFiles]) => (
              <li key={folder} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{folder}</p>
                <p className="mt-1 text-xs text-slate-500">{groupFiles.length} 个文件</p>
              </li>
            ))}
            {analysis.groups.length === 0 ? <li className="text-slate-400">暂无文件</li> : null}
          </ul>
        </div>
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">重复文件检测</h3>
          <ul className="space-y-2 text-sm">
            {analysis.duplicates.map((dupList, index) => (
              <li key={`${dupList[0].name}-${index}`} className="rounded-xl bg-rose-50 p-3">
                <p className="font-semibold text-rose-700">{dupList[0].name}</p>
                <p className="mt-1 text-xs text-rose-500">检测到 {dupList.length} 份重复，大小 {Math.round(dupList[0].size / 1024)} KB</p>
              </li>
            ))}
            {analysis.duplicates.length === 0 ? <li className="text-slate-400">未发现重复文件</li> : null}
          </ul>
        </div>
      </article>
    </section>
  );
}
