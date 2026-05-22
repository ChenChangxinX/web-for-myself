"use client";

import { useMemo, useState } from "react";

type Mode =
  | "chat"
  | "treehole"
  | "qa"
  | "blog"
  | "photo"
  | "video"
  | "music"
  | "book"
  | "movie"
  | "food"
  | "travel"
  | "skill"
  | "second"
  | "event"
  | "poll"
  | "confession"
  | "wish"
  | "daily"
  | "voice"
  | "docs";

interface Meta {
  title: string;
  badge: string;
  desc: string;
  mode: Mode;
}

interface DocState {
  title: string;
  text: string;
  version: number;
  permission: "owner" | "editor" | "viewer";
}

interface SocialState {
  posts: string[];
  likes: number;
  votes: { optionA: number; optionB: number; optionC: number };
  moodTag: string;
  reportCount: number;
  supportCount: number;
  voiceRoomOn: boolean;
  doc: DocState;
}

const META: Record<string, Meta> = {
  "anonymous-chat": { title: "匿名聊天室", badge: "CHAT", desc: "即时聊天 + 过滤与举报", mode: "chat" },
  "tree-hole": { title: "树洞倾诉", badge: "TREEHOLE", desc: "匿名表达 + 情绪标签", mode: "treehole" },
  "qa-community": { title: "问答社区", badge: "Q&A", desc: "提问回答 + 点赞采纳", mode: "qa" },
  "blog-platform": { title: "博客发布平台", badge: "BLOG", desc: "文章发布 + 标签管理", mode: "blog" },
  "photo-sharing": { title: "图片分享社区", badge: "PHOTO", desc: "图片发布 + 互动评论", mode: "photo" },
  "short-video": { title: "短视频分享", badge: "VIDEO", desc: "短视频上传 + 热度", mode: "video" },
  "music-sharing": { title: "音乐分享", badge: "MUSIC", desc: "歌单推荐 + 播放榜", mode: "music" },
  "book-review": { title: "书评社区", badge: "BOOK", desc: "书评发布 + 评分", mode: "book" },
  "movie-review": { title: "影评社区", badge: "MOVIE", desc: "影评发布 + 打分", mode: "movie" },
  "food-sharing": { title: "美食分享", badge: "FOOD", desc: "菜谱笔记 + 打卡", mode: "food" },
  "travel-sharing": { title: "旅行分享", badge: "TRAVEL", desc: "旅行攻略 + 游记", mode: "travel" },
  "skill-swap": { title: "技能交换", badge: "SKILL", desc: "技能匹配 + 互助", mode: "skill" },
  "second-hand": { title: "二手交易", badge: "SECOND", desc: "闲置发布 + 交易沟通", mode: "second" },
  "event-publish": { title: "活动发布", badge: "EVENT", desc: "活动组织 + 报名", mode: "event" },
  "poll-platform": { title: "投票平台", badge: "POLL", desc: "多选项投票 + 实时结果", mode: "poll" },
  "confession-wall": { title: "表白墙", badge: "CONFESSION", desc: "匿名表白 + 祝福", mode: "confession" },
  "wish-list-sharing": { title: "愿望清单分享", badge: "WISH", desc: "愿望公开 + 支持", mode: "wish" },
  "daily-photo": { title: "每日一图", badge: "DAILY", desc: "每日摄影 + 连续打卡", mode: "daily" },
  "voice-chat": { title: "语音聊天", badge: "VOICE", desc: "房间语音 + 排麦", mode: "voice" },
  "collab-docs": { title: "协作文档", badge: "DOCS", desc: "多人编辑 + 版本回溯", mode: "docs" },
};

function defaultState(): SocialState {
  return {
    posts: [],
    likes: 0,
    votes: { optionA: 2, optionB: 3, optionC: 1 },
    moodTag: "平静",
    reportCount: 0,
    supportCount: 0,
    voiceRoomOn: false,
    doc: {
      title: "协作文档草稿",
      text: "# 会议纪要\n- 议题\n- 决议\n- 待办",
      version: 1,
      permission: "editor",
    },
  };
}

function readState(toolId: string): SocialState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(`social-tool-state:${toolId}`);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<SocialState>;
    return {
      ...defaultState(),
      ...parsed,
      votes: { ...defaultState().votes, ...(parsed.votes ?? {}) },
      doc: { ...defaultState().doc, ...(parsed.doc ?? {}) },
    };
  } catch {
    return defaultState();
  }
}

function saveState(toolId: string, state: SocialState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`social-tool-state:${toolId}`, JSON.stringify(state));
}

function moodHint(value: string) {
  if (value.includes("焦虑") || value.includes("低落")) return "建议先做 4-7-8 呼吸，再发帖。";
  if (value.includes("开心") || value.includes("兴奋")) return "积极状态适合发布长文或开语音房。";
  return "保持真实表达，也请注意隐私信息。";
}

function keywordRisk(text: string) {
  const risky = ["联系方式", "转账", "银行卡", "住址", "辱骂", "刷单"];
  return risky.filter((key) => text.includes(key));
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function SocialToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "社交互动工具", badge: "SOCIAL", desc: "社区互动实验台", mode: "chat" as const };
  const [state, setState] = useState<SocialState>(() => readState(toolId));
  const [input, setInput] = useState("");
  const [validation, setValidation] = useState("");

  const voteTotal = useMemo(() => state.votes.optionA + state.votes.optionB + state.votes.optionC, [state.votes]);

  function mutate(next: Partial<SocialState>) {
    setState((current) => {
      const merged = { ...current, ...next };
      saveState(toolId, merged);
      return merged;
    });
  }

  function addPost(prefix: string) {
    const value = input.trim();
    if (!value) {
      setValidation("请输入内容后再发布");
      return;
    }
    if (value.length > 180) {
      setValidation("内容过长，请控制在 180 字以内");
      return;
    }
    const risks = keywordRisk(value);
    if (risks.length > 0) {
      setValidation(`检测到敏感词: ${risks.join("、")}，请修改后再发布`);
      return;
    }
    if (state.posts.some((item) => item.endsWith(value))) {
      setValidation("请勿重复发布相同内容");
      return;
    }
    setValidation("");
    mutate({ posts: [`${prefix}${value}`, ...state.posts].slice(0, 30) });
    setInput("");
  }

  function vote(option: "optionA" | "optionB" | "optionC") {
    mutate({ votes: { ...state.votes, [option]: state.votes[option] + 1 } });
  }

  function exportPosts() {
    const payload = {
      tool: toolId,
      title: meta.title,
      exportedAt: new Date().toISOString(),
      posts: state.posts,
      stats: {
        likes: state.likes,
        supportCount: state.supportCount,
        reportCount: state.reportCount,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-posts.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPollCsv() {
    const lines = [
      "option,votes,ratio",
      `A,${state.votes.optionA},${voteTotal === 0 ? "0%" : `${Math.round((state.votes.optionA / voteTotal) * 100)}%`}`,
      `B,${state.votes.optionB},${voteTotal === 0 ? "0%" : `${Math.round((state.votes.optionB / voteTotal) * 100)}%`}`,
      `C,${state.votes.optionC},${voteTotal === 0 ? "0%" : `${Math.round((state.votes.optionC / voteTotal) * 100)}%`}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-poll.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportDoc() {
    const lines = [
      `title,${csvEscape(state.doc.title)}`,
      `version,${state.doc.version}`,
      `permission,${state.doc.permission}`,
      `content,${csvEscape(state.doc.text)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-doc.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-emerald-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.desc}</p>
      </header>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setValidation("");
            }}
            placeholder="输入要发布的内容"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (meta.mode === "treehole") addPost("树洞: ");
              else if (meta.mode === "qa") addPost("问题: ");
              else if (meta.mode === "blog") addPost("博客: ");
              else if (meta.mode === "photo") addPost("图片: ");
              else if (meta.mode === "video") addPost("视频: ");
              else if (meta.mode === "music") addPost("音乐: ");
              else if (meta.mode === "book") addPost("书评: ");
              else if (meta.mode === "movie") addPost("影评: ");
              else if (meta.mode === "food") addPost("美食: ");
              else if (meta.mode === "travel") addPost("旅行: ");
              else if (meta.mode === "skill") addPost("技能: ");
              else if (meta.mode === "second") addPost("闲置: ");
              else if (meta.mode === "event") addPost("活动: ");
              else if (meta.mode === "confession") addPost("表白: ");
              else if (meta.mode === "wish") addPost("愿望: ");
              else if (meta.mode === "daily") addPost("每日: ");
              else if (meta.mode === "voice") addPost("语音房: ");
              else if (meta.mode === "docs") addPost("协作: ");
              else addPost("消息: ");
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >发布</button>
          <button type="button" onClick={exportPosts} className="rounded-full border border-slate-300 px-4 py-2 text-xs">导出帖子</button>
        </div>
        {validation ? <p className="text-xs text-rose-600">{validation}</p> : null}

        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-2">点赞: {state.likes}</div>
          <div className="rounded-xl bg-slate-50 p-2">举报: {state.reportCount}</div>
          <div className="rounded-xl bg-slate-50 p-2">支持: {state.supportCount}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => mutate({ likes: state.likes + 1 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">点赞 +1</button>
          <button type="button" onClick={() => mutate({ reportCount: state.reportCount + 1 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">举报 +1</button>
          <button type="button" onClick={() => mutate({ supportCount: state.supportCount + 1 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">支持 +1</button>
        </div>

        {(meta.mode === "treehole" || meta.mode === "confession") ? (
          <div className="space-y-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
            <input
              value={state.moodTag}
              onChange={(event) => mutate({ moodTag: event.target.value.slice(0, 24) })}
              placeholder="情绪标签"
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
            />
            <p>情绪提示: {moodHint(state.moodTag)}</p>
          </div>
        ) : null}

        {(meta.mode === "poll" || meta.mode === "event") ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-800">投票结果（实时）</p>
            {([
              ["A", state.votes.optionA, "optionA"],
              ["B", state.votes.optionB, "optionB"],
              ["C", state.votes.optionC, "optionC"],
            ] as const).map(([label, count, key]) => {
              const ratio = voteTotal === 0 ? 0 : Math.round((count / voteTotal) * 100);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600"><span>选项 {label}</span><span>{count} 票 / {ratio}%</span></div>
                  <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-500" style={{ width: `${ratio}%` }} /></div>
                  <button type="button" onClick={() => vote(key)} className="rounded-full border border-slate-300 px-3 py-1 text-xs">投 {label}</button>
                </div>
              );
            })}
            <button type="button" onClick={exportPollCsv} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">导出投票 CSV</button>
          </div>
        ) : null}

        {meta.mode === "voice" ? (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <p>语音房状态: {state.voiceRoomOn ? "进行中" : "未开启"}</p>
            <button type="button" onClick={() => mutate({ voiceRoomOn: !state.voiceRoomOn })} className="mt-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs">{state.voiceRoomOn ? "关闭房间" : "开启房间"}</button>
          </div>
        ) : null}

        {meta.mode === "docs" ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">
            <input
              value={state.doc.title}
              onChange={(event) => mutate({ doc: { ...state.doc, title: event.target.value.slice(0, 80) } })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            />
            <textarea
              rows={6}
              value={state.doc.text}
              onChange={(event) => mutate({ doc: { ...state.doc, text: event.target.value.slice(0, 3000) } })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={state.doc.permission}
                onChange={(event) => mutate({ doc: { ...state.doc, permission: event.target.value as DocState["permission"] } })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <option value="owner">owner</option>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
              <button
                type="button"
                onClick={() => mutate({ doc: { ...state.doc, version: state.doc.version + 1 } })}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs"
              >保存新版本</button>
            </div>
            <p>当前版本: v{state.doc.version} · 权限: {state.doc.permission}</p>
            <button type="button" onClick={exportDoc} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">导出文档 CSV</button>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-slate-900">最近动态</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {state.posts.map((post, index) => (
            <li key={`${post}-${index}`} className="rounded-xl bg-slate-50 p-2">{post}</li>
          ))}
          {state.posts.length === 0 ? <li className="text-slate-400">暂无动态</li> : null}
        </ul>
      </article>
    </section>
  );
}
