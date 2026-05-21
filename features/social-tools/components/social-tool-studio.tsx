"use client";

import { useState } from "react";

type Mode = "chat" | "tree" | "qa" | "blog" | "photo" | "video" | "music" | "book" | "movie" | "food" | "travel" | "swap" | "trade" | "event" | "poll" | "confession" | "wish" | "daily" | "voice" | "docs";

interface Meta {
  title: string;
  badge: string;
  desc: string;
  mode: Mode;
}

const META: Record<string, Meta> = {
  "anonymous-chat": { title: "匿名聊天室", badge: "CHAT", desc: "随机聊天和话题匹配", mode: "chat" },
  "tree-hole": { title: "树洞倾诉平台", badge: "TREE", desc: "匿名倾诉和安慰", mode: "tree" },
  "qa-community": { title: "问答社区（Mini 版）", badge: "Q&A", desc: "提问回答与采纳", mode: "qa" },
  "blog-platform": { title: "博客平台", badge: "BLOG", desc: "博客发布与订阅", mode: "blog" },
  "photo-sharing": { title: "照片分享平台", badge: "PHOTO", desc: "图文发布和互动", mode: "photo" },
  "short-video": { title: "短视频分享平台", badge: "VIDEO", desc: "视频主题和评论", mode: "video" },
  "music-sharing": { title: "音乐分享平台", badge: "MUSIC", desc: "歌单推荐与评论", mode: "music" },
  "book-review": { title: "书评分享平台", badge: "BOOK", desc: "书评和评分", mode: "book" },
  "movie-review": { title: "电影评论平台", badge: "MOVIE", desc: "影评和影单", mode: "movie" },
  "food-sharing": { title: "美食分享平台", badge: "FOOD", desc: "美食打卡和推荐", mode: "food" },
  "travel-sharing": { title: "旅行分享平台", badge: "TRAVEL", desc: "游记和路线", mode: "travel" },
  "skill-swap": { title: "技能交换平台", badge: "SWAP", desc: "技能互助匹配", mode: "swap" },
  "second-hand": { title: "二手交易平台", badge: "TRADE", desc: "闲置发布和交易", mode: "trade" },
  "event-publish": { title: "活动发布平台", badge: "EVENT", desc: "活动创建报名", mode: "event" },
  "poll-platform": { title: "投票调查平台", badge: "POLL", desc: "问卷与投票", mode: "poll" },
  "confession-wall": { title: "表白墙", badge: "LOVE", desc: "匿名表白互动", mode: "confession" },
  "wish-list-sharing": { title: "愿望清单分享", badge: "WISH", desc: "愿望进度追踪", mode: "wish" },
  "daily-photo": { title: "每日一图分享", badge: "DAILY", desc: "每日投稿展示", mode: "daily" },
  "voice-chat": { title: "语音聊天室", badge: "VOICE", desc: "房间话题讨论", mode: "voice" },
  "collab-docs": { title: "在线协作文档", badge: "DOCS", desc: "多人编辑评论", mode: "docs" }
};

export function SocialToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "社交工具", badge: "SOCIAL", desc: "社交互动实验台", mode: "chat" as const };
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>(["选项A", "选项B"]);
  const [votes, setVotes] = useState<number[]>([0, 0]);

  function publish(prefix: string) {
    const value = input.trim();
    if (!value) return;
    setPosts((current) => [`${prefix}${value}`, ...current].slice(0, 12));
    setInput("");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-fuchsia-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.desc}</p>
      </header>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex gap-2">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入内容..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              if (meta.mode === "chat") publish("匿名: ");
              else if (meta.mode === "tree") publish("树洞: ");
              else if (meta.mode === "qa") publish("问题: ");
              else if (meta.mode === "blog") publish("博客: ");
              else if (meta.mode === "photo") publish("照片: ");
              else if (meta.mode === "video") publish("短视频: ");
              else if (meta.mode === "music") publish("歌单: ");
              else if (meta.mode === "book") publish("书评: ");
              else if (meta.mode === "movie") publish("影评: ");
              else if (meta.mode === "food") publish("美食: ");
              else if (meta.mode === "travel") publish("游记: ");
              else if (meta.mode === "swap") publish("技能: ");
              else if (meta.mode === "trade") publish("闲置: ");
              else if (meta.mode === "event") publish("活动: ");
              else if (meta.mode === "confession") publish("表白: ");
              else if (meta.mode === "wish") publish("愿望: ");
              else if (meta.mode === "daily") publish("今日图: ");
              else if (meta.mode === "voice") publish("房间: ");
              else if (meta.mode === "docs") publish("文档: ");
              else publish("");
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            发布
          </button>
        </div>

        {meta.mode === "poll" ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input value={options[0]} onChange={(event) => setOptions((current) => [event.target.value, current[1]])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <input value={options[1]} onChange={(event) => setOptions((current) => [current[0], event.target.value])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setVotes((current) => [current[0] + 1, current[1]])} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">投 {options[0]}</button>
              <button type="button" onClick={() => setVotes((current) => [current[0], current[1] + 1])} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">投 {options[1]}</button>
            </div>
            <p className="text-sm text-slate-700">结果：{options[0]} {votes[0]} 票，{options[1]} {votes[1]} 票</p>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-slate-900">动态列表</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {posts.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl bg-slate-50 p-2">{item}</li>)}
          {posts.length === 0 ? <li className="text-slate-400">暂无内容</li> : null}
        </ul>
      </article>
    </section>
  );
}
