import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "表情包制作器 | 娱乐创意",
  description: "上传图片添加文字，快速生成表情包并保存灵感。",
};

export default function MemeMakerPage() {
  return <FunToolStudio toolId="meme-maker" />;
}