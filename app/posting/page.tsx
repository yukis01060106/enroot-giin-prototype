"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Star, Pencil, Sparkles, Share2, MessageCircle, Trash2, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/appStore";
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
        <h2 className="mb-4 text-xl font-bold">SNSで活動の報告をしましょう！</h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/posting/create")}
            className="flex items-center gap-3 rounded-card bg-white p-4 text-left text-text-primary shadow-card"
          >
            <Sparkles size={26} className="text-brand-green" />
            <span className="flex-1 font-bold leading-snug">秘書の美咲といっしょに投稿文を作成する</span>
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
          <button
            onClick={() => router.push("/posting/edit")}
            className="flex items-center gap-3 rounded-card bg-white p-4 text-left text-text-primary shadow-card"
          >
            <Pencil size={26} className="text-primary-blue" />
            <span className="flex-1 font-bold leading-snug">自分で投稿文を作成する</span>
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        </div>

        {drafts.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">下書き（{drafts.length}件）</h2>
            <div className="flex flex-col gap-2">
              {drafts.map((d) => (
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
              ))}
            </div>
          </>
        )}
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
