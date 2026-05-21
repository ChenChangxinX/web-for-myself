"use client";

import { useMemo, useState } from "react";

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
  "collab-docs": { title: "在线协作文档", badge: "DOCS", desc: "多人编辑评论", mode: "docs" },
};

function hints(mode: Mode) {
  const table: Record<Mode, string[]> = {
    chat: ["随机匹配", "文字+表情", "举报机制"],
    tree: ["匿名倾诉", "情绪分析", "咨询建议"],
    qa: ["提问回答", "采纳点赞", "积分系统"],
    blog: ["Markdown", "RSS 订阅", "专栏归档"],
    photo: ["滤镜标签", "照片故事", "互动评论"],
    video: ["剪辑特效", "话题挑战", "点赞评论"],
    music: ["歌单推荐", "歌词同步", "推荐算法"],
    book: ["书评评分", "阅读进度", "主题书单"],
    movie: ["观影记录", "影评评分", "影单"],
    food: ["美食打卡", "地点地图", "餐厅推荐"],
    travel: ["行程规划", "游记分享", "旅行足迹"],
    swap: ["技能发布", "匹配算法", "线上教学"],
    trade: ["信用评价", "同城交易", "私信沟通"],
    event: ["活动提醒", "报名管理", "签到"],
    poll: ["多题型问卷", "结果统计", "可视化"],
    confession: ["匿名表白", "成功率", "回应"],
    wish: ["愿望进度", "众筹支持", "见证"],
    daily: ["每日投稿", "图片日历", "评选"],
    voice: ["多人语音", "房间主题", "录音回放"],
    docs: ["实时协作", "权限控制", "模板+版本"],
  };
  return table[mode];
}

export function SocialToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "社交工具", badge: "SOCIAL", desc: "社交互动实验台", mode: "chat" as const };
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>(["选项A", "选项B"]);
  const [votes, setVotes] = useState<number[]>([0, 0]);
  const [interest, setInterest] = useState("电影");
  const [reportCount, setReportCount] = useState(0);
  const [topic, setTopic] = useState("闲聊");
  const [supportCount, setSupportCount] = useState(0);
  const [docPermission, setDocPermission] = useState("可编辑");
  const [docVersion, setDocVersion] = useState(1);

  const matchScore = useMemo(() => {
    const base = `${interest}${input}`.length;
    return 60 + (base % 41);
  }, [interest, input]);

  function publish(prefix: string) {
    const value = input.trim();
    if (!value) return;
    setPosts((current) => [`${prefix}${value}`, ...current].slice(0, 16));
    setInput("");
  }

  const negativeHint = useMemo(() => {
    const text = input.toLowerCase();
    if (text.includes("累") || text.includes("难过") || text.includes("焦虑")) {
      return "检测到负面情绪，建议先做呼吸放松并联系可信赖的人。";
    }
    return "情绪平稳，可继续表达。";
  }, [input]);

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-fuchsia-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.desc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hints(meta.mode).map((item) => (
            <span key={item} className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs text-fuchsia-700">{item}</span>
          ))}
        </div>
      </header>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        {(meta.mode === "chat" || meta.mode === "swap" || meta.mode === "voice") ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={interest} onChange={(event) => setInterest(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>电影</option><option>音乐</option><option>旅行</option><option>编程</option>
            </select>
            <select value={topic} onChange={(event) => setTopic(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>闲聊</option><option>求助</option><option>合作</option><option>分享</option>
            </select>
          </div>
        ) : null}

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
              else if (meta.mode === "voice") publish("语音房间: ");
              else if (meta.mode === "docs") publish("文档更新: ");
              else publish("");
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >发布</button>
        </div>

        {meta.mode === "chat" ? (
          <div className="space-y-1 text-sm text-slate-700">
            <p>兴趣匹配度: {matchScore}% · 当前话题: {topic}</p>
            <button type="button" onClick={() => setReportCount((value) => value + 1)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">举报不当内容</button>
            <p>累计举报: {reportCount}</p>
          </div>
        ) : null}

        {meta.mode === "tree" ? <p className="text-sm text-slate-700">情绪分析: {negativeHint} · 咨询入口: 可联系志愿者（演示）</p> : null}
        {meta.mode === "qa" ? <p className="text-sm text-slate-700">支持采纳答案、点赞评论，积分 +5 / 次回答（演示）</p> : null}
        {meta.mode === "blog" ? <p className="text-sm text-slate-700">RSS 订阅地址: /feed.xml · 专栏归档按标签聚合（演示）</p> : null}
        {meta.mode === "photo" ? <p className="text-sm text-slate-700">支持滤镜标签与照片故事串联（演示）</p> : null}
        {meta.mode === "video" ? <p className="text-sm text-slate-700">视频编辑: 剪辑 + 特效 + 话题挑战（演示）</p> : null}
        {meta.mode === "music" ? <p className="text-sm text-slate-700">歌词同步开关 + 基于兴趣推荐歌单（演示）</p> : null}
        {meta.mode === "book" ? <p className="text-sm text-slate-700">书评评分 + 阅读进度同步 + 主题书单（演示）</p> : null}
        {meta.mode === "movie" ? <p className="text-sm text-slate-700">观影记录 + 影评评分 + 影单收藏（演示）</p> : null}
        {meta.mode === "food" ? <p className="text-sm text-slate-700">地图定位: 附近美食推荐（演示）</p> : null}
        {meta.mode === "travel" ? <p className="text-sm text-slate-700">行程规划: 3 天路线模板 + 足迹地图（演示）</p> : null}
        {meta.mode === "swap" ? <p className="text-sm text-slate-700">技能匹配度: {matchScore}% · 可发起线上教学约课（演示）</p> : null}
        {meta.mode === "trade" ? <p className="text-sm text-slate-700">信用分: 4.8/5 · 支持同城面交标签（演示）</p> : null}
        {meta.mode === "event" ? <p className="text-sm text-slate-700">活动提醒: 自动提前 1 小时通知 · 支持签到码（演示）</p> : null}

        {meta.mode === "poll" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex gap-2">
              <input value={options[0]} onChange={(event) => setOptions((current) => [event.target.value, current[1]])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              <input value={options[1]} onChange={(event) => setOptions((current) => [current[0], event.target.value])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setVotes((current) => [current[0] + 1, current[1]])} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">投 {options[0]}</button>
              <button type="button" onClick={() => setVotes((current) => [current[0], current[1] + 1])} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">投 {options[1]}</button>
            </div>
            <p>结果: {options[0]} {votes[0]} 票, {options[1]} {votes[1]} 票</p>
            <p className="text-xs text-slate-500">题型扩展: 单选 / 多选 / 填空（演示）</p>
          </div>
        ) : null}

        {meta.mode === "confession" ? <p className="text-sm text-slate-700">表白成功率: 62%（模拟） · 支持被表白者回应（演示）</p> : null}

        {meta.mode === "wish" ? (
          <div className="space-y-1 text-sm text-slate-700">
            <button type="button" onClick={() => setSupportCount((value) => value + 1)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">众筹支持 +1</button>
            <p>当前支持人数: {supportCount}</p>
          </div>
        ) : null}

        {meta.mode === "daily" ? <p className="text-sm text-slate-700">图片日历: 最近 7 天均可回看（演示）</p> : null}
        {meta.mode === "voice" ? <p className="text-sm text-slate-700">房间主题: {topic} · 支持录音回放（演示）</p> : null}

        {meta.mode === "docs" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <select value={docPermission} onChange={(event) => setDocPermission(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>可编辑</option><option>仅评论</option><option>仅查看</option>
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDocVersion((value) => value + 1)} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">创建新版本</button>
              <button type="button" onClick={() => publish("模板: ")} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">插入模板</button>
            </div>
            <p>权限: {docPermission} · 版本: v{docVersion}</p>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-slate-900">动态列表</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {posts.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl bg-slate-50 p-2">{item}</li>
          ))}
          {posts.length === 0 ? <li className="text-slate-400">暂无内容</li> : null}
        </ul>
      </article>
    </section>
  );
}
