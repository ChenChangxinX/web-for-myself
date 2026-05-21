"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type ToolMode = "generator" | "zodiac" | "fortune" | "guess" | "typing" | "memory" | "jigsaw" | "music" | "virtual-pet" | "doodle";

interface ToolMeta {
  title: string;
  badge: string;
  description: string;
  mode: ToolMode;
  prompts?: string[];
  withImage?: boolean;
}

const META: Record<string, ToolMeta> = {
  "meme-maker": { title: "表情包制作器", badge: "MEME", description: "上传图片+文案快速做梗图，支持模板灵感。", mode: "generator", withImage: true, prompts: ["今天也要加油", "这很合理", "我先笑为敬", "老板我懂了"] },
  "avatar-generator": { title: "头像生成器", badge: "AVATAR", description: "关键词生成多风格头像灵感。", mode: "generator", withImage: true, prompts: ["像素风勇者", "水彩少女", "赛博猫咪", "极简黑白"] },
  "quote-generator": { title: "名言生成器", badge: "QUOTE", description: "随机名言和朋友圈文案。", mode: "generator", prompts: ["把今天过成作品", "慢一点，比较快", "先完成，再完美", "热爱可抵岁月漫长"] },
  "zodiac-fortune": { title: "星座运势查询", badge: "ZODIAC", description: "每日运势、配对和星座知识卡。", mode: "zodiac" },
  "fortune-stick": { title: "抽签工具", badge: "FORTUNE", description: "抽签、解签、许愿记录。", mode: "fortune" },
  "guess-number": { title: "猜数字游戏", badge: "GAME", description: "难度可选的经典猜数字挑战。", mode: "guess" },
  "typing-speed": { title: "打字速度测试", badge: "TYPING", description: "测速、准确率、练习模式。", mode: "typing" },
  "memory-game": { title: "记忆力游戏", badge: "MEMORY", description: "翻牌配对，统计步数和用时。", mode: "memory" },
  "jigsaw-game": { title: "拼图游戏", badge: "JIGSAW", description: "数字拼图，支持计时挑战。", mode: "jigsaw", withImage: true },
  "music-player": { title: "音乐播放器", badge: "MUSIC", description: "本地音频播放列表与歌词备注。", mode: "music" },
  "movie-recommender": { title: "电影推荐工具", badge: "MOVIE", description: "按偏好生成电影推荐和收藏。", mode: "generator", prompts: ["高分悬疑", "轻松治愈", "科幻烧脑", "热血成长"] },
  "recipe-sharing": { title: "美食食谱分享", badge: "RECIPE", description: "保存食谱和购物清单。", mode: "generator", withImage: true, prompts: ["15分钟快手菜", "高蛋白减脂餐", "一人食治愈晚餐", "周末甜点"] },
  "travel-diary": { title: "旅行日记", badge: "TRAVEL", description: "记录地点、图片和路线。", mode: "generator", withImage: true, prompts: ["城市漫步", "海边落日", "山野徒步", "博物馆巡礼"] },
  "pet-diary": { title: "宠物日记", badge: "PET", description: "宠物日常、健康提醒和多宠记录。", mode: "generator", withImage: true, prompts: ["今天体重", "疫苗提醒", "散步时长", "最爱零食"] },
  "mood-diary": { title: "心情日记", badge: "MOOD", description: "情绪记录与趋势总结。", mode: "generator", prompts: ["开心", "平静", "焦虑", "感恩"] },
  "dream-recorder": { title: "梦境记录器", badge: "DREAM", description: "梦境标签和关键词分析。", mode: "generator", prompts: ["飞行", "迷宫", "旧友重逢", "陌生城市"] },
  "story-generator": { title: "随机故事生成器", badge: "STORY", description: "输入关键词生成多风格故事。", mode: "generator", prompts: ["校园悬疑", "太空冒险", "古风奇遇", "平行时空"] },
  "poetry-generator": { title: "诗歌生成器", badge: "POETRY", description: "生成不同诗体并给出押韵提示。", mode: "generator", prompts: ["春天", "想念", "远方", "夜雨"] },
  "virtual-pet": { title: "虚拟宠物养成", badge: "PET LIFE", description: "喂食、玩耍、睡眠提升亲密度。", mode: "virtual-pet" },
  "doodle-board": { title: "在线涂鸦板", badge: "DOODLE", description: "自由绘画与清空画板。", mode: "doodle" },
};

function hashNumber(text: string) {
  return Array.from(text).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FunToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "创意工具", badge: "FUN", description: "创意实验台", mode: "generator" as const };

  const [keyword, setKeyword] = useState("");
  const [output, setOutput] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const [sign, setSign] = useState("白羊座");
  const [pairSign, setPairSign] = useState("天秤座");

  const [wish, setWish] = useState("");
  const [wishes, setWishes] = useState<string[]>([]);
  const sticks = ["上上签", "上签", "中签", "小吉", "平签"];
  const [stickResult, setStickResult] = useState("点击抽签");

  const [digits, setDigits] = useState(3);
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 900) + 100);
  const [guess, setGuess] = useState("");
  const [guessLogs, setGuessLogs] = useState<string[]>([]);

  const samples = ["hello creative world", "coding is art", "practice makes perfect", "stay focused and ship"];
  const [typingText, setTypingText] = useState(samples[0]);
  const [typingInput, setTypingInput] = useState("");
  const [typingStart, setTypingStart] = useState<number | null>(null);

  const [cards, setCards] = useState<{ id: number; value: string; open: boolean; matched: boolean }[]>(() => {
    const icons = ["🍓", "🍋", "🍇", "🍉", "🍍", "🥝"];
    return shuffle([...icons, ...icons]).map((value, index) => ({ id: index + 1, value, open: false, matched: false }));
  });
  const [step, setStep] = useState(0);
  const [typingElapsedMs, setTypingElapsedMs] = useState(0);

  const [board, setBoard] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [selected, setSelected] = useState<number | null>(null);

  const [tracks, setTracks] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [currentTrack, setCurrentTrack] = useState("");

  const [pet, setPet] = useState({ hunger: 60, mood: 60, energy: 60, level: 1 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawColor, setDrawColor] = useState("#0f172a");
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    return () => {
      tracks.forEach((track) => URL.revokeObjectURL(track.url));
    };
  }, [tracks]);

  useEffect(() => {
    if (meta.mode !== "memory") {
      return;
    }
    const opening = cards.filter((card) => card.open && !card.matched);
    if (opening.length !== 2) {
      return;
    }
    const [a, b] = opening;
    if (a.value === b.value) {
      const timer = window.setTimeout(() => {
        setStep((current) => current + 1);
        setCards((current) => current.map((card) => (card.value === a.value && card.open ? { ...card, matched: true } : card)));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setStep((current) => current + 1);
      setCards((current) => current.map((card) => (card.open && !card.matched ? { ...card, open: false } : card)));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [cards, meta.mode]);

  useEffect(() => {
    if (!typingStart) {
      return;
    }
    const timer = window.setInterval(() => {
      setTypingElapsedMs(Date.now() - typingStart);
    }, 250);
    return () => window.clearInterval(timer);
  }, [typingStart]);

  function generate() {
    const base = keyword.trim() || meta.title;
    const pool = meta.prompts ?? ["灵感", "创作", "分享", "惊喜"];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setOutput(`${base} · ${pick} · ${new Date().toLocaleTimeString("zh-CN")}`);
  }

  function uploadImage(file: File | undefined) {
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }

  function drawFortune() {
    const index = Math.floor(Math.random() * sticks.length);
    const value = sticks[index];
    setStickResult(`${value}：${value.includes("上") ? "保持行动，会有好结果。" : "稳住节奏，先做好眼前事。"}`);
  }

  function submitGuess() {
    const value = Number(guess);
    if (!Number.isFinite(value)) {
      return;
    }
    if (value === secret) {
      setGuessLogs((current) => [`${value} ✅ 猜对了`, ...current]);
      const max = Number("9".repeat(digits));
      const min = Number("1" + "0".repeat(Math.max(0, digits - 1)));
      setSecret(Math.floor(Math.random() * (max - min + 1)) + min);
      setGuess("");
      return;
    }
    setGuessLogs((current) => [`${value} ${value > secret ? "太大" : "太小"}`, ...current].slice(0, 8));
  }

  function startTyping() {
    const text = samples[Math.floor(Math.random() * samples.length)];
    setTypingText(text);
    setTypingInput("");
    setTypingElapsedMs(0);
    setTypingStart(Date.now());
  }

  const typingStats = useMemo(() => {
    if (!typingStart || typingInput.length === 0) {
      return { wpm: 0, accuracy: 100 };
    }
    const elapsedMinutes = typingElapsedMs / 60000;
    const words = typingInput.trim().split(/\s+/).filter(Boolean).length;
    const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
    const matched = typingInput.split("").filter((char, index) => typingText[index] === char).length;
    const accuracy = Math.round((matched / Math.max(typingInput.length, 1)) * 100);
    return { wpm, accuracy };
  }, [typingElapsedMs, typingInput, typingText, typingStart]);

  function toggleCard(id: number) {
    const opening = cards.filter((card) => card.open && !card.matched).length;
    setCards((current) =>
      current.map((card) => {
        if (card.id !== id || card.open || card.matched || opening >= 2) {
          return card;
        }
        return { ...card, open: true };
      }),
    );
  }

  function selectTile(index: number) {
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const next = [...board];
    [next[selected], next[index]] = [next[index], next[selected]];
    setBoard(next);
    setSelected(null);
  }

  function addTracks(files: FileList | null) {
    if (!files) {
      return;
    }
    const next = Array.from(files).map((file) => ({ id: `${Date.now()}-${file.name}`, name: file.name, url: URL.createObjectURL(file) }));
    setTracks((current) => [...current, ...next]);
    if (!currentTrack && next[0]) {
      setCurrentTrack(next[0].url);
    }
  }

  function petAction(type: "feed" | "play" | "rest") {
    setPet((current) => {
      if (type === "feed") {
        return { ...current, hunger: Math.min(current.hunger + 18, 100), mood: Math.min(current.mood + 4, 100) };
      }
      if (type === "play") {
        const mood = Math.min(current.mood + 15, 100);
        const energy = Math.max(current.energy - 10, 0);
        const level = mood > 90 ? current.level + 1 : current.level;
        return { ...current, mood, energy, level };
      }
      return { ...current, energy: Math.min(current.energy + 20, 100), hunger: Math.max(current.hunger - 5, 0) };
    });
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    setDrawing(true);
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-rose-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.description}</p>
      </header>

      {meta.mode === "generator" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="输入关键词，例如“旅行”“治愈”" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <button type="button" onClick={generate} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">生成灵感</button>
            <button type="button" onClick={() => output && setSaved((current) => [output, ...current].slice(0, 8))} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">收藏</button>
          </div>
          {meta.withImage ? <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} className="text-sm" /> : null}
          {imageUrl ? <Image src={imageUrl} alt="preview" width={720} height={420} unoptimized className="max-h-56 w-auto rounded-2xl border border-slate-200 object-contain" /> : null}
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{output || "点击生成按钮获得一个新点子"}</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {saved.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl bg-amber-50 p-2">{item}</li>)}
          </ul>
        </article>
      ) : null}

      {meta.mode === "zodiac" ? (
        <article className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
          <div className="space-y-3">
            <select value={sign} onChange={(event) => setSign(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={pairSign} onChange={(event) => setPairSign(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
            <p>今日事业：{(hashNumber(sign) % 5) + 1} / 5</p>
            <p>今日爱情：{(hashNumber(sign + "love") % 5) + 1} / 5</p>
            <p>今日财运：{(hashNumber(sign + "money") % 5) + 1} / 5</p>
            <p>配对指数：{60 + (hashNumber(sign + pairSign) % 41)}%</p>
          </div>
        </article>
      ) : null}

      {meta.mode === "fortune" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <button type="button" onClick={drawFortune} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">抽签</button>
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{stickResult}</p>
          <div className="flex gap-2">
            <input value={wish} onChange={(event) => setWish(event.target.value)} placeholder="写下你的愿望" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <button type="button" onClick={() => wish.trim() && setWishes((current) => [wish.trim(), ...current].slice(0, 6))} className="rounded-full border border-slate-300 px-4 py-2 text-sm">记录愿望</button>
          </div>
          <ul className="space-y-1 text-sm text-slate-600">{wishes.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul>
        </article>
      ) : null}

      {meta.mode === "guess" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap gap-2">
            <select value={digits} onChange={(event) => setDigits(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option value={2}>2位</option><option value={3}>3位</option><option value={4}>4位</option>
            </select>
            <button type="button" onClick={() => {
              const max = Number("9".repeat(digits));
              const min = Number("1" + "0".repeat(Math.max(0, digits - 1)));
              setSecret(Math.floor(Math.random() * (max - min + 1)) + min);
              setGuessLogs([]);
            }} className="rounded-full border border-slate-300 px-4 py-2 text-sm">重新开始</button>
          </div>
          <div className="flex gap-2">
            <input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder="输入猜测数字" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <button type="button" onClick={submitGuess} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">提交</button>
          </div>
          <ul className="space-y-1 text-sm text-slate-600">{guessLogs.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
        </article>
      ) : null}

      {meta.mode === "typing" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <button type="button" onClick={startTyping} className="rounded-full border border-slate-300 px-4 py-2 text-sm">随机题目</button>
          <p className="rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-700">{typingText}</p>
          <textarea value={typingInput} onChange={(event) => setTypingInput(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <p className="text-sm text-slate-600">速度 {typingStats.wpm} WPM · 准确率 {typingStats.accuracy}%</p>
        </article>
      ) : null}

      {meta.mode === "memory" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">步数：{step}</p>
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => (
              <button key={card.id} type="button" onClick={() => toggleCard(card.id)} className="h-14 rounded-xl border border-slate-200 bg-slate-50 text-xl">
                {card.open || card.matched ? card.value : "?"}
              </button>
            ))}
          </div>
        </article>
      ) : null}

      {meta.mode === "jigsaw" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          {meta.withImage ? <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} className="text-sm" /> : null}
          {imageUrl ? <Image src={imageUrl} alt="puzzle-preview" width={640} height={320} unoptimized className="max-h-40 w-auto rounded-xl border border-slate-200 object-contain" /> : null}
          <div className="grid grid-cols-3 gap-2">
            {board.map((value, index) => (
              <button key={`${value}-${index}`} type="button" onClick={() => selectTile(index)} className={`h-16 rounded-xl border text-lg font-bold ${selected === index ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
                {value}
              </button>
            ))}
          </div>
        </article>
      ) : null}

      {meta.mode === "music" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <input type="file" accept="audio/*" multiple onChange={(event) => addTracks(event.target.files)} className="text-sm" />
          <ul className="space-y-1 text-sm text-slate-700">
            {tracks.map((track) => (
              <li key={track.id}>
                <button type="button" onClick={() => setCurrentTrack(track.url)} className="text-left text-sky-700 hover:underline">{track.name}</button>
              </li>
            ))}
          </ul>
          {currentTrack ? <audio controls src={currentTrack} className="w-full" /> : <p className="text-sm text-slate-400">请先添加音频文件</p>}
        </article>
      ) : null}

      {meta.mode === "virtual-pet" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">等级 Lv.{pet.level}</p>
          <p className="text-sm">饱食度 {pet.hunger} · 心情 {pet.mood} · 精力 {pet.energy}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => petAction("feed")} className="rounded-full border border-slate-300 px-4 py-2 text-sm">喂食</button>
            <button type="button" onClick={() => petAction("play")} className="rounded-full border border-slate-300 px-4 py-2 text-sm">玩耍</button>
            <button type="button" onClick={() => petAction("rest")} className="rounded-full border border-slate-300 px-4 py-2 text-sm">睡觉</button>
          </div>
        </article>
      ) : null}

      {meta.mode === "doodle" ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex gap-2">
            <input type="color" value={drawColor} onChange={(event) => setDrawColor(event.target.value)} className="h-10 w-14 rounded border border-slate-200" />
            <button type="button" onClick={clearDraw} className="rounded-full border border-slate-300 px-4 py-2 text-sm">清空</button>
          </div>
          <canvas
            ref={canvasRef}
            width={900}
            height={380}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={() => setDrawing(false)}
            onPointerLeave={() => setDrawing(false)}
            className="h-auto w-full rounded-2xl border border-slate-200 bg-white"
          />
        </article>
      ) : null}
    </section>
  );
}
