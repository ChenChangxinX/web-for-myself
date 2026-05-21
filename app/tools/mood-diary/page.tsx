import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "心情日记 | 娱乐创意",
  description: "记录情绪状态并生成轻量趋势。",
};

export default function MoodDiaryPage() {
  return <FunToolStudio toolId="mood-diary" />;
}