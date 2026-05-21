import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "背诵助手 | 学习教育", description: "分段背诵和默写练习。" };
export default function Page() { return <LearningToolStudio toolId="recite-helper" />; }