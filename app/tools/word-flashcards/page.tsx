import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "单词记忆卡片 | 学习教育", description: "复习节奏和单词卡片管理。" };
export default function Page() { return <LearningToolStudio toolId="word-flashcards" />; }