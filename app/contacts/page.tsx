"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SuspenseBoundary } from "@/components/SuspenseBoundary";
import { useDetailId } from "@/lib/useDetailId";
import { PersonListView } from "@/components/contacts/PersonListView";
import { PersonDetail } from "@/components/contacts/PersonDetail";
import { NekkoSection } from "@/components/contacts/NekkoSection";

function ContactsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = useDetailId();
  const tab = searchParams.get("tab") === "community" ? "community" : "list";

  if (detailId) {
    return <PersonDetail personId={detailId} />;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-primary-blue px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{tab === "list" ? "名刺管理" : "コミュニティ"}</h1>
      </header>

      <div className="flex gap-2 p-3">
        <button
          onClick={() => router.push("/contacts")}
          className={`h-tap-target flex-1 rounded-input font-bold ${
            tab === "list" ? "bg-brand-green text-white" : "border border-neutral-gray text-text-primary"
          }`}
        >
          名刺一覧
        </button>
        <button
          onClick={() => router.push("/contacts?tab=community")}
          className={`h-tap-target flex-1 rounded-input font-bold ${
            tab === "community" ? "bg-brand-green text-white" : "border border-neutral-gray text-text-primary"
          }`}
        >
          ねっこの会
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "list" ? <PersonListView /> : <NekkoSection />}
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
