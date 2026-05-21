import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "美食食谱分享 | 娱乐创意",
  description: "收藏和生成食谱灵感，支持购物清单思路。",
};

export default function RecipeSharingPage() {
  return <FunToolStudio toolId="recipe-sharing" />;
}