import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "随机故事生成器 | 娱乐创意",
  description: "输入关键词生成故事并保存灵感。",
};

export default function StoryGeneratorPage() {
  return <FunToolStudio toolId="story-generator" />;
}