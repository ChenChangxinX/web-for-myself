import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "在线白板教学 | 学习教育", description: "课堂板书和互动记录。" };
export default function Page() { return <LearningToolStudio toolId="teaching-whiteboard" />; }