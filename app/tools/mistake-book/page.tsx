import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "错题本 | 学习教育", description: "错题记录和复习安排。" };
export default function Page() { return <LearningToolStudio toolId="mistake-book" />; }