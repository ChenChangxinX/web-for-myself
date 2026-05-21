import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "打字速度测试 | 娱乐创意",
  description: "测试打字速度和准确率，支持练习模式。",
};

export default function TypingSpeedPage() {
  return <FunToolStudio toolId="typing-speed" />;
}