import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "拼图游戏 | 娱乐创意",
  description: "上传图片并体验拼图挑战。",
};

export default function JigsawGamePage() {
  return <FunToolStudio toolId="jigsaw-game" />;
}