import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "知识卡片 | 学习教育", description: "知识点卡片和随机复习。" };
export default function Page() { return <LearningToolStudio toolId="knowledge-cards" />; }