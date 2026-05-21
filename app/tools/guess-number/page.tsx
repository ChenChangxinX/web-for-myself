import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "猜数字游戏 | 娱乐创意",
  description: "经典猜数字游戏，支持不同难度。",
};

export default function GuessNumberPage() {
  return <FunToolStudio toolId="guess-number" />;
}