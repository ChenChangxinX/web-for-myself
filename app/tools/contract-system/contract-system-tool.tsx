"use client";

import { useMemo, useState } from "react";

interface ContractItem {
  id: string;
  name: string;
  party: string;
  signedDate: string;
  expiryDate: string;
  status: string;
  signature: string;
}

export function ContractSystemTool() {
  const [items, setItems] = useState<ContractItem[]>([]);
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [signedDate, setSignedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [signature, setSignature] = useState("");

  const upcoming = useMemo(() => {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);
    return items.filter((item) => {
      if (!item.expiryDate) return false;
      const d = new Date(item.expiryDate);
      return d >= now && d <= in30;
    });
  }, [items]);

  function createFromTemplate(template: "nda" | "service") {
    if (template === "nda") {
      setName("保密协议（NDA）");
    } else {
      setName("服务合同");
    }
  }

  function addContract() {
    if (!name.trim() || !party.trim()) return;
    const next: ContractItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      name: name.trim(),
      party: party.trim(),
      signedDate,
      expiryDate,
      status: "生效中",
      signature: signature.trim() || `电子签名:${party.trim()}@${new Date().toLocaleDateString("zh-CN")}`,
    };
    setItems((current) => [next, ...current]);
    setName("");
    setParty("");
    setSignature("");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => createFromTemplate("nda")} className="rounded-full border border-slate-300 px-3 py-1 text-xs">使用 NDA 模板</button>
          <button type="button" onClick={() => createFromTemplate("service")} className="rounded-full border border-slate-300 px-3 py-1 text-xs">使用服务合同模板</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="合同名称" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={party} onChange={(event) => setParty(event.target.value)} placeholder="签约方" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="date" value={signedDate} onChange={(event) => setSignedDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="电子签名文本（可选）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button type="button" onClick={addContract} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存合同</button>
      </article>

      <article className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">到期提醒（30 天内）</h3>
          <ul className="space-y-2 text-sm">
            {upcoming.map((item) => <li key={item.id} className="rounded-xl bg-amber-50 p-3 text-amber-800">{item.name} · 到期 {item.expiryDate}</li>)}
            {upcoming.length === 0 ? <li className="text-slate-400">暂无即将到期合同</li> : null}
          </ul>
        </div>
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">合同列表</h3>
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">{item.party} · 签约 {item.signedDate || "-"} · 到期 {item.expiryDate || "-"}</p>
                <p className="mt-1 text-xs text-slate-600">{item.signature}</p>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}
