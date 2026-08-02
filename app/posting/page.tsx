"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Pencil } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { PostingStatusCard } from "@/components/PostingStatusCard";

export default function PostingPage() {
  const router = useRouter();
  const drafts = useAppStore((s) => s.postDrafts);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-gradient-primary px-2 text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">発信</h1>
        </div>
        <button
          onClick={() => router.push("/posting/benchmark-accounts")}
          aria-label="ベンチマークアカウント"
          className="rounded-full p-2"
        >
          <Star size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-bold">下書き</h2>
        <p className="text-sm text-text-secondary">AIが記録メモから発信候補を自動検出しました</p>
        <div className="mt-2 flex flex-col gap-2">
          {drafts.length === 0 ? (
            <p className="py-4 text-text-secondary">下書きはありません</p>
          ) : (
            drafts.map((d) => (
              <button
                key={d.id}
                onClick={() => router.push(`/posting/edit?draftId=${d.id}`)}
                className="rounded-card bg-white p-3 text-left shadow-card"
              >
                <p className="line-clamp-3">{d.content}</p>
                {d.sourceSummary && (
                  <p className="mt-1 text-xs text-text-secondary">元の記録: {d.sourceSummary}</p>
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => router.push("/posting/edit")}
          className="mt-2 flex h-tap-target w-full items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue"
        >
          <Pencil size={18} />
          自分で書く
        </button>

        <h2 className="mb-2 mt-6 text-lg font-bold">今月の発信状況</h2>
        <PostingStatusCard />
      </div>
    </div>
  );
}
