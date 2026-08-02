"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";
import { SuspenseBoundary } from "@/components/SuspenseBoundary";
import { useDetailId } from "@/lib/useDetailId";
import { PersonListView } from "@/components/contacts/PersonListView";
import { PersonDetail } from "@/components/contacts/PersonDetail";

function ContactsInner() {
  const router = useRouter();
  const detailId = useDetailId();

  if (detailId) {
    return <PersonDetail personId={detailId} />;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-lg font-bold">名刺管理</h1>
        <button
          onClick={() => router.push("/settings/tags")}
          aria-label="タグ設定"
          className="rounded-full p-2"
        >
          <Settings2 size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <PersonListView />
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <SuspenseBoundary>
      <ContactsInner />
    </SuspenseBoundary>
  );
}
