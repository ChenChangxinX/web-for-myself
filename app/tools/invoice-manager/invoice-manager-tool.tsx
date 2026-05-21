"use client";

import { useMemo, useState } from "react";

interface InvoiceItem {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  note: string;
}

function parseByOcr(text: string) {
  const amountMatch = text.match(/(\d+(?:\.\d{1,2})?)/);
  const dateMatch = text.match(/(20\d{2}[-\/.]\d{1,2}[-\/.]\d{1,2})/);
  return {
    amount: amountMatch ? Number(amountMatch[1]) : 0,
    date: dateMatch ? dateMatch[1].replaceAll("/", "-").replaceAll(".", "-") : "",
  };
}

export function InvoiceManagerTool() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("交通");
  const [note, setNote] = useState("");
  const [ocrText, setOcrText] = useState("");

  const summary = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const byCat = new Map<string, number>();
    items.forEach((item) => byCat.set(item.category, (byCat.get(item.category) ?? 0) + item.amount));
    return { total, byCat: Array.from(byCat.entries()) };
  }, [items]);

  function addItem() {
    if (!vendor.trim() || amount <= 0) return;
    const next: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      vendor: vendor.trim(),
      amount,
      date: date || new Date().toISOString().slice(0, 10),
      category,
      note,
    };
    setItems((current) => [next, ...current]);
    setVendor("");
    setAmount(0);
    setNote("");
  }

  function applyOcr() {
    const parsed = parseByOcr(ocrText);
    if (parsed.amount > 0) setAmount(parsed.amount);
    if (parsed.date) setDate(parsed.date);
  }

  function exportReport() {
    const lines = ["发票报销单", "", ...items.map((item) => `${item.date} | ${item.vendor} | ${item.category} | ¥${item.amount.toFixed(2)}`), "", `合计: ¥${summary.total.toFixed(2)}`];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">OCR 辅助录入</h2>
        <textarea value={ocrText} onChange={(event) => setOcrText(event.target.value)} rows={4} placeholder="粘贴 OCR 识别文本，例如包含日期和金额" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <button type="button" onClick={applyOcr} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">解析文本</button>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">新增发票</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="商户" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} placeholder="金额" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><option>交通</option><option>餐饮</option><option>办公</option><option>差旅</option><option>其他</option></select>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="备注" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addItem} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">保存发票</button>
          <button type="button" onClick={exportReport} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">导出报销单</button>
        </div>
      </article>

      <article className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">发票列表</h3>
          <ul className="space-y-2 text-sm">
            {items.map((item) => <li key={item.id} className="rounded-xl bg-slate-50 p-3">{item.date} · {item.vendor} · {item.category} · ¥{item.amount.toFixed(2)}</li>)}
          </ul>
        </div>
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">统计</h3>
          <p className="text-sm text-slate-700">总金额：¥{summary.total.toFixed(2)}</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {summary.byCat.map(([cat, value]) => <li key={cat}>{cat}：¥{value.toFixed(2)}</li>)}
          </ul>
        </div>
      </article>
    </section>
  );
}
