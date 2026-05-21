import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "头像生成器 | 娱乐创意",
  description: "根据关键词生成多风格头像灵感。",
};

export default function AvatarGeneratorPage() {
  return <FunToolStudio toolId="avatar-generator" />;
}