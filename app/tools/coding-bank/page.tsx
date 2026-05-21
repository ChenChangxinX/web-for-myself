import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "编程题库 | 学习教育", description: "编程题练习与解题记录。" };
export default function Page() { return <LearningToolStudio toolId="coding-bank" />; }