"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NekkoSection } from "@/components/contacts/NekkoSection";

/**
 * 「ねっこの会」は元々/contactsのサブタブだったが、名刺管理（連絡先）と
 * コミュニティ活動は別物なので独立ルートに分離した。
 */
export default function CommunityPage() {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">コミュニティ</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <NekkoSection />
      </div>
    </div>
  );
}
