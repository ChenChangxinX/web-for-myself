import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "宠物日记 | 娱乐创意",
  description: "记录宠物日常、健康提醒和照片。",
};

export default function PetDiaryPage() {
  return <FunToolStudio toolId="pet-diary" />;
}