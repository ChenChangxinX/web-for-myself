import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "音乐播放器 | 娱乐创意",
  description: "本地音频播放列表和简单可视化入口。",
};

export default function MusicPlayerPage() {
  return <FunToolStudio toolId="music-player" />;
}