import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "诗歌生成器 | 娱乐创意",
  description: "按主题生成多风格诗歌。",
};

export default function PoetryGeneratorPage() {
  return <FunToolStudio toolId="poetry-generator" />;
}