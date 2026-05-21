import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "虚拟宠物养成 | 娱乐创意",
  description: "喂食、玩耍和升级的虚拟宠物互动。",
};

export default function VirtualPetPage() {
  return <FunToolStudio toolId="virtual-pet" />;
}