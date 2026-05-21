import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "思维导图工具 | 学习教育", description: "知识结构化梳理。" };
export default function Page() { return <LearningToolStudio toolId="mind-map" />; }