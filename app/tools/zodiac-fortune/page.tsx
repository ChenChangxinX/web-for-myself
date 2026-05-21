import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "星座运势查询 | 娱乐创意",
  description: "查看每日运势和星座配对。",
};

export default function ZodiacFortunePage() {
  return <FunToolStudio toolId="zodiac-fortune" />;
}