"use client";

import { useMemo, useState } from "react";

type Mode = "flashcard" | "math" | "coding" | "planner" | "mistake" | "cards" | "mindmap" | "schedule" | "notes" | "practice" | "recite" | "duration" | "reading" | "paper" | "whiteboard" | "homework" | "countdown" | "group" | "skill" | "achievement";

interface Meta {
  title: string;
  badge: string;
  desc: string;
  mode: Mode;
}

const META: Record<string, Meta> = {
  "word-flashcards": { title: "单词记忆卡片", badge: "FLASHCARD", desc: "复习节奏 + 例句 + 熟练度", mode: "flashcard" },
  "math-generator": { title: "数学练习题生成器", badge: "MATH", desc: "随机题目 + 即时判分", mode: "math" },
  "coding-bank": { title: "编程题库", badge: "CODING", desc: "题目筛选 + 解题记录", mode: "coding" },
  "study-planner": { title: "学习计划制定工具", badge: "PLAN", desc: "目标拆解 + 周计划", mode: "planner" },
  "mistake-book": { title: "错题本", badge: "MISTAKE", desc: "错题收集 + 复习状态", mode: "mistake" },
  "knowledge-cards": { title: "知识卡片", badge: "CARD", desc: "Markdown 卡片 + 随机复习", mode: "cards" },
  "mind-map": { title: "思维导图工具", badge: "MAP", desc: "节点层级 + 结构梳理", mode: "mindmap" },
  "course-schedule": { title: "课程表管理", badge: "COURSE", desc: "课程安排 + 作业提醒", mode: "schedule" },
  "notes-sharing": { title: "学习笔记分享平台", badge: "NOTES", desc: "发布笔记 + 收藏评分", mode: "notes" },
  "question-practice": { title: "在线题库练习", badge: "PRACTICE", desc: "刷题记录 + 正确率", mode: "practice" },
  "recite-helper": { title: "背诵助手", badge: "RECITE", desc: "遮挡关键词 + 默写", mode: "recite" },
  "study-duration": { title: "学习时长统计", badge: "DURATION", desc: "计时 + 周趋势", mode: "duration" },
  "reading-notes": { title: "读书笔记管理", badge: "READING", desc: "书单进度 + 摘抄", mode: "reading" },
  "paper-manager": { title: "论文管理工具", badge: "PAPER", desc: "文献 + 引用格式", mode: "paper" },
  "teaching-whiteboard": { title: "在线白板教学", badge: "TEACH", desc: "板书 + 教学互动", mode: "whiteboard" },
  "homework-submit": { title: "作业提交系统", badge: "HOMEWORK", desc: "作业提交 + 批改状态", mode: "homework" },
  "exam-countdown": { title: "考试倒计时", badge: "EXAM", desc: "考试节点 + 复习进度", mode: "countdown" },
  "study-group": { title: "学习小组管理", badge: "GROUP", desc: "小组任务 + 打卡", mode: "group" },
  "skill-tree": { title: "技能树可视化", badge: "SKILL", desc: "路径解锁 + 阶段追踪", mode: "skill" },
  "study-achievement": { title: "学习成就系统", badge: "ACHIEVE", desc: "勋章 + 连续学习", mode: "achievement" },
};

function dateAfterDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export function LearningToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "学习工具", badge: "LEARN", desc: "学习实验台", mode: "planner" as const };

  const [text, setText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [hours, setHours] = useState<number[]>([1.5, 2, 1, 2.5, 3, 2.2, 1.8]);
  const [countdownDate, setCountdownDate] = useState(() => dateAfterDays(7));

  const summary = useMemo(() => {
    const total = hours.reduce((sum, h) => sum + h, 0);
    const avg = hours.length > 0 ? total / hours.length : 0;
    return { total, avg: avg.toFixed(1) };
  }, [hours]);

  const daysLeft = useMemo(() => {
    const now = new Date();
    const diff = new Date(countdownDate).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [countdownDate]);

  function addItem(prefix: string) {
    const value = text.trim();
    if (!value) return;
    setItems((current) => [`${prefix} ${value}`, ...current].slice(0, 12));
    setText("");
  }

  function randomMath() {
    const a = Math.floor(Math.random() * 50);
    const b = Math.floor(Math.random() * 50);
    setText(`${a} + ${b} = ?（答案 ${a + b}）`);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-sky-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.desc}</p>
      </header>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入内容" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              if (meta.mode === "math") randomMath();
              else if (meta.mode === "flashcard") addItem("单词:");
              else if (meta.mode === "coding") addItem("题目:");
              else if (meta.mode === "mistake") addItem("错题:");
              else if (meta.mode === "cards") addItem("知识:");
              else if (meta.mode === "mindmap") addItem("节点:");
              else if (meta.mode === "schedule") addItem("课程:");
              else if (meta.mode === "notes") addItem("笔记:");
              else if (meta.mode === "practice") addItem("练习:");
              else if (meta.mode === "recite") addItem("背诵:");
              else if (meta.mode === "reading") addItem("书摘:");
              else if (meta.mode === "paper") addItem("论文:");
              else if (meta.mode === "whiteboard") addItem("板书:");
              else if (meta.mode === "homework") addItem("作业:");
              else if (meta.mode === "group") addItem("小组:");
              else if (meta.mode === "skill") addItem("技能点:");
              else if (meta.mode === "achievement") addItem("成就:");
              else addItem("计划:");
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {meta.mode === "math" ? "生成题目" : "添加"}
          </button>
        </div>

        {meta.mode === "duration" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>本周学习总时长：{summary.total.toFixed(1)} 小时</p>
            <p>日均学习时长：{summary.avg} 小时</p>
            <button type="button" onClick={() => setHours((current) => [...current.slice(1), Number((1 + Math.random() * 3).toFixed(1))])} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">刷新一周样本</button>
          </div>
        ) : null}

        {meta.mode === "countdown" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <input type="date" value={countdownDate} onChange={(event) => setCountdownDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            <p>距离考试还有 {daysLeft} 天</p>
          </div>
        ) : null}

        {meta.mode === "achievement" ? (
          <div className="space-y-2 text-sm">
            <p>当前积分：{score}</p>
            <button type="button" onClick={() => setScore((value) => value + 10)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">完成任务 +10</button>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-slate-900">记录列表</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {items.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl bg-slate-50 p-2">{item}</li>)}
          {items.length === 0 ? <li className="text-slate-400">暂无记录</li> : null}
        </ul>
      </article>
    </section>
  );
}
