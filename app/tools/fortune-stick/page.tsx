import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "抽签工具 | 娱乐创意",
  description: "在线抽签、解签与许愿记录。",
};

export default function FortuneStickPage() {
  return <FunToolStudio toolId="fortune-stick" />;
}