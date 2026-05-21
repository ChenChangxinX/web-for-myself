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

function hints(mode: Mode) {
  const table: Record<Mode, string[]> = {
    flashcard: ["艾宾浩斯复习", "点击发音", "例句记忆"],
    math: ["多题型多难度", "自动批改", "错题沉淀"],
    coding: ["在线写题", "测试评测", "解法分享"],
    planner: ["目标拆解", "智能下一步", "学习报告"],
    mistake: ["拍照/OCR辅助", "分类管理", "错误分析"],
    cards: ["Markdown", "标签搜索", "间隔复习"],
    mindmap: ["节点编辑", "颜色层级", "导图导出"],
    schedule: ["课程提醒", "作业记录", "课程评价"],
    notes: ["笔记分享", "代码高亮", "评分与付费"],
    practice: ["分科刷题", "错题历史", "模拟考试"],
    recite: ["分段背诵", "关键词遮挡", "默写检查"],
    duration: ["时长趋势", "专注分析", "学习排行"],
    reading: ["读书进度", "摘抄感想", "读书报告"],
    paper: ["文献管理", "参考格式", "引用网络"],
    whiteboard: ["在线讲解", "课堂互动", "分组讨论"],
    homework: ["提交预览", "批改评分", "成绩统计"],
    countdown: ["考试倒计时", "复习提醒", "复习计划"],
    group: ["资料讨论", "打卡监督", "语音讨论"],
    skill: ["技能解锁", "多路径", "里程碑"],
    achievement: ["勋章奖励", "排行榜", "成就分享"],
  };
  return table[mode];
}

export function LearningToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "学习工具", badge: "LEARN", desc: "学习实验台", mode: "planner" as const };

  const [text, setText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("中等");
  const [topic, setTopic] = useState("综合");
  const [score, setScore] = useState(0);
  const [countdownDate, setCountdownDate] = useState(() => dateAfterDays(7));
  const [hours, setHours] = useState<number[]>([1.8, 2.1, 1.2, 2.6, 2.9, 1.5, 2.3]);
  const [example, setExample] = useState("");
  const [reviewBox, setReviewBox] = useState(1);
  const [focusLoss, setFocusLoss] = useState(1);
  const [checkins, setCheckins] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [planDone, setPlanDone] = useState(0);

  const daysLeft = useMemo(() => {
    const now = new Date();
    const diff = new Date(countdownDate).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [countdownDate]);

  const hourSummary = useMemo(() => {
    const total = hours.reduce((sum, value) => sum + value, 0);
    return { total, avg: (total / hours.length).toFixed(1) };
  }, [hours]);

  function addItem(prefix: string) {
    const value = text.trim();
    if (!value) return;
    setItems((current) => [`${prefix}${value}`, ...current].slice(0, 16));
    setText("");
  }

  function generateMath() {
    const base = difficulty === "简单" ? 20 : difficulty === "困难" ? 100 : 50;
    const a = Math.floor(Math.random() * base);
    const b = Math.floor(Math.random() * base);
    if (topic === "方程") {
      setText(`题目: x + ${b} = ${a + b}，答案 ${a}`);
      return;
    }
    if (topic === "几何") {
      setText(`题目: 边长 ${a} 的正方形面积是？答案 ${a * a}`);
      return;
    }
    setText(`题目: ${a} + ${b} = ?，答案 ${a + b}`);
  }

  function speakWord() {
    const value = text.trim();
    if (!value || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(value);
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  }

  function reviewHint() {
    if (reviewBox <= 1) return "建议明天复习";
    if (reviewBox === 2) return "建议 3 天后复习";
    if (reviewBox === 3) return "建议 7 天后复习";
    if (reviewBox === 4) return "建议 14 天后复习";
    return "建议 30 天后复习";
  }

  const progress = Math.min(100, Math.round((planDone / Math.max(planDone + 2, 6)) * 100));

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-sky-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.desc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hints(meta.mode).map((item) => (
            <span key={item} className="rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700">{item}</span>
          ))}
        </div>
      </header>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        {(meta.mode === "math" || meta.mode === "practice") ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>简单</option><option>中等</option><option>困难</option>
            </select>
            <select value={topic} onChange={(event) => setTopic(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>综合</option><option>方程</option><option>几何</option>
            </select>
          </div>
        ) : null}

        <div className="flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入内容" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              if (meta.mode === "math") generateMath();
              else if (meta.mode === "flashcard") addItem("单词: ");
              else if (meta.mode === "coding") addItem("题目: ");
              else if (meta.mode === "mistake") addItem("错题: ");
              else if (meta.mode === "cards") addItem("知识卡: ");
              else if (meta.mode === "mindmap") addItem("节点: ");
              else if (meta.mode === "schedule") addItem("课程: ");
              else if (meta.mode === "notes") addItem("笔记: ");
              else if (meta.mode === "practice") addItem("练习: ");
              else if (meta.mode === "recite") addItem("背诵: ");
              else if (meta.mode === "reading") addItem("读书: ");
              else if (meta.mode === "paper") addItem("文献: ");
              else if (meta.mode === "whiteboard") addItem("课堂: ");
              else if (meta.mode === "homework") addItem("作业: ");
              else if (meta.mode === "group") addItem("小组: ");
              else if (meta.mode === "skill") addItem("技能: ");
              else if (meta.mode === "achievement") addItem("成就: ");
              else addItem("计划: ");
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >{meta.mode === "math" ? "生成题目" : "添加"}</button>
          {meta.mode === "flashcard" ? <button type="button" onClick={speakWord} className="rounded-full border border-slate-300 px-4 py-2 text-xs">发音</button> : null}
        </div>

        {meta.mode === "flashcard" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={example} onChange={(event) => setExample(event.target.value)} placeholder="例句" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <select value={reviewBox} onChange={(event) => setReviewBox(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option value={1}>Box 1</option><option value={2}>Box 2</option><option value={3}>Box 3</option><option value={4}>Box 4</option><option value={5}>Box 5</option>
            </select>
            <p className="sm:col-span-2 text-xs text-slate-500">{reviewHint()} · 例句: {example || "未填写"}</p>
          </div>
        ) : null}

        {meta.mode === "coding" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <textarea rows={4} placeholder="在线编写代码（示例）" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs" />
            <button type="button" onClick={() => setItems((current) => [`评测结果: 3/4 通过`, ...current].slice(0, 16))} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">运行测试</button>
          </div>
        ) : null}

        {meta.mode === "planner" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>当前计划完成度: {progress}%</p>
            <button type="button" onClick={() => setPlanDone((value) => value + 1)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">完成一项任务</button>
            <p>智能建议: {progress < 50 ? "先做 25 分钟最小任务" : "转入复盘并规划下一阶段"}</p>
          </div>
        ) : null}

        {meta.mode === "mistake" ? (
          <div className="space-y-1 text-sm text-slate-700">
            <input type="file" accept="image/*" className="text-xs" />
            <p>OCR 辅助: 支持从题图提取文字（演示模式）</p>
            <p>错误分析: 概念 40% / 计算 35% / 审题 25%</p>
          </div>
        ) : null}

        {meta.mode === "schedule" ? <p className="text-sm text-slate-700">课程提醒: 课前 30 分钟 · 支持课程评价与资料备注</p> : null}
        {meta.mode === "notes" ? <p className="text-sm text-slate-700">支持 Markdown 与代码块展示，笔记可评分并设置付费可见（演示）</p> : null}
        {meta.mode === "practice" ? <p className="text-sm text-slate-700">可按科目和难度刷题，系统依据错题记录推荐相似题（演示）</p> : null}
        {meta.mode === "recite" ? <p className="text-sm text-slate-700">关键词遮挡: {text ? text.replace(/[\u4e00-\u9fa5A-Za-z0-9]/g, "▢") : "输入内容后自动遮挡"}</p> : null}

        {meta.mode === "duration" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>本周总时长: {hourSummary.total.toFixed(1)} 小时 · 日均 {hourSummary.avg} 小时</p>
            <p>分心次数: {focusLoss}</p>
            <button type="button" onClick={() => setFocusLoss((value) => value + 1)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">记录分心</button>
            <button type="button" onClick={() => setHours((current) => [...current.slice(1), Number((1 + Math.random() * 3).toFixed(1))])} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">刷新样本</button>
          </div>
        ) : null}

        {meta.mode === "reading" ? <p className="text-sm text-slate-700">读书进度: {Math.min(100, items.length * 8)}% · 支持读书报告导出（演示）</p> : null}
        {meta.mode === "paper" ? <p className="text-sm text-slate-700">支持 APA/MLA/GB-T 引用格式与文献关联网络（演示）</p> : null}
        {meta.mode === "whiteboard" ? <p className="text-sm text-slate-700">课堂互动: 举手提问 + 分组讨论 + 回放（演示）</p> : null}
        {meta.mode === "homework" ? <p className="text-sm text-slate-700">上传预览 + 批改评分 + 查重提示 + 成绩统计（演示）</p> : null}

        {meta.mode === "countdown" ? (
          <div className="space-y-1 text-sm text-slate-700">
            <input type="date" value={countdownDate} onChange={(event) => setCountdownDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            <p>距离考试还有 {daysLeft} 天</p>
            <p>复习提醒: 每天 20:00</p>
          </div>
        ) : null}

        {meta.mode === "group" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>今日打卡人数: {checkins}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCheckins((value) => value + 1)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">打卡 +1</button>
              <button type="button" onClick={() => setVoiceOn((value) => !value)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">{voiceOn ? "关闭语音" : "开启语音"}</button>
            </div>
          </div>
        ) : null}

        {meta.mode === "skill" ? <p className="text-sm text-slate-700">多路径技能树: 基础路径 / 项目路径，已解锁节点 {Math.min(8, items.length + 2)}</p> : null}

        {meta.mode === "achievement" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>当前积分: {score} · 排名: 第 {Math.max(1, 30 - Math.floor(score / 10))} 名</p>
            <button type="button" onClick={() => setScore((value) => value + 10)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">完成任务 +10</button>
            <button type="button" onClick={() => setItems((current) => [`成就分享: 今日获得 1 枚勋章`, ...current].slice(0, 16))} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">分享成就</button>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-slate-900">记录列表</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl bg-slate-50 p-2">{item}</li>
          ))}
          {items.length === 0 ? <li className="text-slate-400">暂无记录</li> : null}
        </ul>
      </article>
    </section>
  );
}
