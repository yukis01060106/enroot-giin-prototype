"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Star, Pencil, Sparkles, Share2, MessageCircle, Trash2, FileEdit } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { PostingStatusCard } from "@/components/PostingStatusCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { formatMD } from "@/lib/formatDate";

export default function PostingPage() {
  const router = useRouter();
  const drafts = useAppStore((s) => s.postDrafts);
  const removePostDraft = useAppStore((s) => s.removePostDraft);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-gradient-primary px-2 text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">SNS発信</h1>
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
            <EmptyState icon={FileEdit} message="下書きはありません" actionHint="下の「美咲と一緒に作る」から作成できます" />
          ) : (
            drafts.map((d) => (
              <div key={d.id} className="rounded-card bg-white p-3 shadow-card">
                <button onClick={() => router.push(`/posting/edit?draftId=${d.id}`)} className="w-full text-left">
                  <p className="line-clamp-3">{d.content}</p>
                  {d.sourceSummary && (
                    <p className="mt-1 text-xs text-text-secondary">元の記録: {d.sourceSummary}</p>
                  )}
                </button>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-blue/12 text-primary-blue">
                      <Share2 size={11} />
                    </span>
                    {d.lineContent && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-green/12 text-brand-green">
                        <MessageCircle size={11} />
                      </span>
                    )}
                    <span className="text-xs">{formatMD(new Date(d.createdAt))}作成</span>
                  </div>
                  <button
                    onClick={() => setDeleteTargetId(d.id)}
                    aria-label="下書きを削除"
                    className="p-1 text-text-secondary"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => router.push("/posting/create")}
          className="mt-2 flex h-tap-target w-full items-center justify-center gap-2 rounded-input bg-gradient-brand-green font-bold text-white"
        >
          <Sparkles size={18} />
          美咲と一緒に作る
        </button>
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

      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
        title="下書きを削除"
        footer={
          <>
            <button onClick={() => setDeleteTargetId(null)} className="px-3 py-2 text-text-secondary">
              キャンセル
            </button>
            <button
              onClick={() => {
                if (deleteTargetId) removePostDraft(deleteTargetId);
                setDeleteTargetId(null);
              }}
              className="rounded-input bg-error px-4 py-2 font-semibold text-white"
            >
              削除する
            </button>
          </>
        }
      >
        <p className="leading-relaxed">この下書きを削除しますか？この操作は取り消せません。</p>
      </Dialog>
    </div>
  );
}
