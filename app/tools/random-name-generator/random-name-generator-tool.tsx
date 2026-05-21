"use client";

import { useMemo, useState } from "react";

type NameStyle = "person" | "company" | "product";

const personFirst = ["林", "陈", "赵", "许", "苏", "沈", "周", "程"];
const personSecond = ["子", "语", "知", "星", "嘉", "沐", "清", "然", "奕", "舟"];
const companyPrefix = ["云", "星", "智", "新", "极", "远", "蓝", "火"];
const companySuffix = ["科技", "数据", "网络", "创新", "智能", "互联", "未来"];
const productPrefix = ["轻", "快", "灵", "智", "简", "潮", "云", "码"];
const productSuffix = ["笔记", "助手", "引擎", "工坊", "管家", "盒子", "计划"];

interface GeneratedName {
  name: string;
  domain: string;
  available: boolean;
}

function randomFrom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function fakeDomainAvailable(domain: string): boolean {
  const sum = domain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return sum % 3 !== 0;
}

export function RandomNameGeneratorTool() {
  const [style, setStyle] = useState<NameStyle>("person");
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(8);
  const [items, setItems] = useState<GeneratedName[]>([]);

  const styleLabel = useMemo(
    () => ({ person: "人名", company: "公司名", product: "产品名" } as const),
    [],
  );

  function generate() {
    const trimmedKeyword = keyword.trim();
    const generated = Array.from({ length: count }).map(() => {
      let name = "";
      if (style === "person") {
        name = `${randomFrom(personFirst)}${randomFrom(personSecond)}${Math.random() > 0.5 ? randomFrom(personSecond) : ""}`;
      } else if (style === "company") {
        name = `${trimmedKeyword}${randomFrom(companyPrefix)}${randomFrom(companySuffix)}`;
      } else {
        name = `${trimmedKeyword}${randomFrom(productPrefix)}${randomFrom(productSuffix)}`;
      }

      const normalized = name.replace(/\s+/g, "").toLowerCase();
      const domain = `${normalized || "mybrand"}.com`;
      return {
        name,
        domain,
        available: fakeDomainAvailable(domain),
      };
    });

    setItems(generated);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">生成参数</h2>

        <label className="text-sm font-semibold text-slate-700" htmlFor="style-select">
          命名类型
        </label>
        <select
          id="style-select"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={style}
          onChange={(event) => setStyle(event.target.value as NameStyle)}
        >
          <option value="person">人名</option>
          <option value="company">公司名</option>
          <option value="product">产品名</option>
        </select>

        <label className="text-sm font-semibold text-slate-700" htmlFor="keyword-input">
          关键词（可选）
        </label>
        <input
          id="keyword-input"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="例如 AI、教育、摄影"
        />

        <label className="text-sm font-semibold text-slate-700" htmlFor="count-input">
          生成数量：{count}
        </label>
        <input
          id="count-input"
          type="range"
          min={3}
          max={20}
          value={count}
          onChange={(event) => setCount(Number.parseInt(event.target.value, 10))}
          className="w-full"
        />

        <button
          type="button"
          onClick={generate}
          className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
        >
          生成名字
        </button>
      </article>

      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">结果（{styleLabel[style]}）</h2>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={`${item.name}-${item.domain}`} className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">{item.domain}</p>
                <p className={`mt-1 text-xs font-medium ${item.available ? "text-emerald-700" : "text-rose-700"}`}>
                  域名检测：{item.available ? "可注册（模拟）" : "已占用（模拟）"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">点击“生成名字”后查看结果。</p>
        )}
      </article>
    </section>
  );
}
