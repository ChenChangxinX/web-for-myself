import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "记忆力游戏 | 娱乐创意",
  description: "翻牌配对小游戏，训练记忆力。",
};

export default function MemoryGamePage() {
  return <FunToolStudio toolId="memory-game" />;
}