"use client";

import { Share2, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { weeklyPostingTarget } from "@/store/appStore";

/** 「今週の発信ステータス」表示。posting_status_card.dart の移植。 */
export function PostingStatusCard() {
  const fb = useAppStore((s) => s.weeklyFacebookCount);
  const line = useAppStore((s) => s.weeklyLineCount);
  const total = fb + line;
  const progress = Math.min(Math.max(total / weeklyPostingTarget, 0), 1);

  return (
    <div className="rounded-card bg-white p-3 shadow-card">
      <div className="flex items-center gap-1.5">
        <Share2 size={20} className="text-primary-blue" />
        <span>Facebook {fb}件</span>
        <span className="ml-4" />
        <MessageCircle size={20} className="text-brand-green" />
        <span>LINE公式 {line}件</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-gray">
        <div className="h-full rounded-full bg-brand-green" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-1 text-sm text-text-secondary">
        今週の目標 週{weeklyPostingTarget}回 中 {total}回発信
      </p>
    </div>
  );
}
