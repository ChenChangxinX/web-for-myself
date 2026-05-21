import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "考试倒计时 | 学习教育", description: "考试日期倒计时和复习节奏。" };
export default function Page() { return <LearningToolStudio toolId="exam-countdown" />; }