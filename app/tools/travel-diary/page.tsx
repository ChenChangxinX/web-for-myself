import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "旅行日记 | 娱乐创意",
  description: "记录旅行地点、图片与路线灵感。",
};

export default function TravelDiaryPage() {
  return <FunToolStudio toolId="travel-diary" />;
}