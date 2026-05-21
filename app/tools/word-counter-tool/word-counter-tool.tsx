"use client";

import { useMemo, useState } from "react";

interface KeywordStat {
  word: string;
  count: number;
}

export function WordCounterTool() {
  const [text, setText] = useState("在这里输入你的文章内容，工具会自动统计字数与关键词。");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const charCount = text.length;
    const charCountNoSpace = text.replace(/\s/g, "").length;
    const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
    const englishWords = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    const wordCount = englishWords.length + chineseCharCount;
    const paragraphCount = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
    const sentenceCount = (text.match(/[。！？!?\.]+/g) ?? []).length;

    const minutesByChinese = chineseCharCount / 300;
    const minutesByEnglish = englishWords.length / 220;
    const readMinutes = Math.max(minutesByChinese, minutesByEnglish, wordCount / 260);

    const keywordTokens = (text.toLowerCase().match(/[\u4e00-\u9fa5]{2,}|[a-z]{3,}/g) ?? []).filter(
      (token) => !["this", "that", "with", "have", "from", "for", "and", "the"].includes(token),
    );

    const frequencyMap = new Map<string, number>();
    keywordTokens.forEach((token) => {
      frequencyMap.set(token, (frequencyMap.get(token) ?? 0) + 1);
    });

    const topKeywords: KeywordStat[] = [...frequencyMap.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return {
      charCount,
      charCountNoSpace,
      chineseCharCount,
      englishWordCount: englishWords.length,
      wordCount,
      paragraphCount,
      sentenceCount,
      readMinutes,
      topKeywords,
    };
  }, [text]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">文本输入</h2>
        <textarea
          className="h-[420px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="输入或粘贴内容后自动统计"
        />
      </article>

      <div className="space-y-6">
        <article className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">统计结果</h2>
          <ul className="grid gap-2 text-sm text-slate-700">
            <li>总字符数：{stats.charCount}</li>
            <li>字符数（不含空白）：{stats.charCountNoSpace}</li>
            <li>中文字符：{stats.chineseCharCount}</li>
            <li>英文词数：{stats.englishWordCount}</li>
            <li>综合词数：{stats.wordCount}</li>
            <li>段落数：{stats.paragraphCount}</li>
            <li>句子数：{stats.sentenceCount}</li>
            <li>预估阅读时长：{Math.max(1, Math.ceil(stats.readMinutes))} 分钟</li>
          </ul>
        </article>

        <article className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">关键词分析</h2>
          {stats.topKeywords.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2">
              {stats.topKeywords.map((item) => (
                <li key={item.word} className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
                  {item.word} x {item.count}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">输入更多文本后可查看高频关键词。</p>
          )}
        </article>
      </div>
    </section>
  );
}
