import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "梦境记录器 | 娱乐创意",
  description: "记录梦境关键词与标签。",
};

export default function DreamRecorderPage() {
  return <FunToolStudio toolId="dream-recorder" />;
}