import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "在线涂鸦板 | 娱乐创意",
  description: "在线画板支持自由绘画和清空重画。",
};

export default function DoodleBoardPage() {
  return <FunToolStudio toolId="doodle-board" />;
}