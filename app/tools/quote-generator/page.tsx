import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "名言生成器 | 娱乐创意",
  description: "随机励志或搞笑语录，支持主题灵感。",
};

export default function QuoteGeneratorPage() {
  return <FunToolStudio toolId="quote-generator" />;
}