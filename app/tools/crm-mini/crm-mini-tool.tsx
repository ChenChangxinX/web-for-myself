"use client";

import { useMemo, useState } from "react";

type Stage = "线索" | "沟通中" | "报价" | "成交" | "流失";

interface Customer {
  id: string;
  name: string;
  contact: string;
  stage: Stage;
  value: number;
  nextFollowUp: string;
  logs: string[];
}

export function CrmMiniTool() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [stage, setStage] = useState<Stage>("线索");
  const [value, setValue] = useState(0);
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [logText, setLogText] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const report = useMemo(() => {
    const byStage = new Map<Stage, number>();
    const totalValue = customers.reduce((sum, item) => sum + item.value, 0);
    customers.forEach((item) => byStage.set(item.stage, (byStage.get(item.stage) ?? 0) + 1));
    return { byStage, totalValue };
  }, [customers]);

  function addCustomer() {
    if (!name.trim()) return;
    const next: Customer = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name: name.trim(),
      contact: contact.trim(),
      stage,
      value,
      nextFollowUp,
      logs: [],
    };
    setCustomers((current) => [next, ...current]);
    setName("");
    setContact("");
    setValue(0);
  }

  function addLog() {
    if (!selectedId || !logText.trim()) return;
    const text = `${new Date().toLocaleString("zh-CN")} ${logText.trim()}`;
    setCustomers((current) => current.map((item) => item.id === selectedId ? { ...item, logs: [text, ...item.logs].slice(0, 20) } : item));
    setLogText("");
  }

  const selected = customers.find((item) => item.id === selectedId);

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-3">
        <div><p className="text-xs text-slate-500">客户数</p><p className="text-2xl font-extrabold text-slate-900">{customers.length}</p></div>
        <div><p className="text-xs text-slate-500">总价值</p><p className="text-2xl font-extrabold text-slate-900">¥{report.totalValue.toFixed(0)}</p></div>
        <div><p className="text-xs text-slate-500">成交数量</p><p className="text-2xl font-extrabold text-slate-900">{report.byStage.get("成交") ?? 0}</p></div>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">新增客户</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="客户名称" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="联系方式" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <select value={stage} onChange={(event) => setStage(event.target.value as Stage)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><option>线索</option><option>沟通中</option><option>报价</option><option>成交</option><option>流失</option></select>
          <input type="number" min={0} value={value} onChange={(event) => setValue(Number(event.target.value))} placeholder="预计价值" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="date" value={nextFollowUp} onChange={(event) => setNextFollowUp(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={addCustomer} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存客户</button>
      </article>

      <article className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">销售漏斗</h3>
          {(["线索", "沟通中", "报价", "成交", "流失"] as Stage[]).map((s) => (
            <p key={s} className="text-sm text-slate-700">{s}：{report.byStage.get(s) ?? 0}</p>
          ))}
          <ul className="mt-2 space-y-2 text-sm">
            {customers.map((item) => (
              <li key={item.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setSelectedId(item.id)} className="font-semibold text-slate-900">{item.name}</button>
                  <select value={item.stage} onChange={(event) => setCustomers((current) => current.map((it) => it.id === item.id ? { ...it, stage: event.target.value as Stage } : it))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                    <option>线索</option><option>沟通中</option><option>报价</option><option>成交</option><option>流失</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500">{item.contact} · ¥{item.value} · 下次跟进 {item.nextFollowUp || "-"}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">沟通记录</h3>
          <textarea value={logText} onChange={(event) => setLogText(event.target.value)} rows={3} placeholder="输入跟进记录" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button type="button" onClick={addLog} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">添加记录</button>
          <ul className="space-y-2 text-sm">
            {(selected?.logs ?? []).map((log, index) => <li key={`${selected?.id}-${index}`} className="rounded-xl bg-slate-50 p-3">{log}</li>)}
            {!selected ? <li className="text-slate-400">先在左侧选择一个客户</li> : null}
          </ul>
        </div>
      </article>
    </section>
  );
}
