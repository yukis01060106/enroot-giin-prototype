"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Share2, MessageCircle, Eye, ShieldAlert, Loader2 } from "lucide-react";
import { SuspenseBoundary } from "@/components/SuspenseBoundary";
import { useAppStore } from "@/store/appStore";
import { suggestHashtags, assessRisk, riskLabels, type RiskLevel } from "@/lib/postingAiService";
import { showNotReady, showToast } from "@/lib/notReady";

const riskColor: Record<RiskLevel, string> = {
  low: "border-brand-green text-brand-green",
  medium: "border-warning text-warning",
  high: "border-error text-error",
};

function PostEditInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const draft = useAppStore((s) => (draftId ? s.postDrafts.find((d) => d.id === draftId) : undefined));
  const publishPost = useAppStore((s) => s.publishPost);

  const [content, setContent] = useState(draft?.content ?? "");
  const [toFacebook, setToFacebook] = useState(true);
  const [toLine, setToLine] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const suggestedHashtags = useMemo(() => suggestHashtags(content), [content]);
  const risk = useMemo(() => assessRisk(content), [content]);
  const needsAck = risk.level !== "low";
  const canSubmit = content.trim() !== "" && (toFacebook || toLine) && (!needsAck || riskAcknowledged);

  const finalContent = useMemo(() => {
    const tags = [...selectedTags].join(" ");
    return tags ? `${content.trim()}\n\n${tags}` : content.trim();
  }, [content, selectedTags]);

  async function publish() {
    if (!canSubmit) return;
    setPosting(true);
    await new Promise((r) => setTimeout(r, 900));
    publishPost({ toFacebook, toLine, draftId: draftId ?? undefined });
    router.push("/posting");
    showToast("投稿しました");
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/posting")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">投稿を編集</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setRiskAcknowledged(false);
          }}
          rows={6}
          placeholder="投稿する内容を入力してください"
          autoFocus={!draft}
          className="w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
        />
        <button
          onClick={() => showNotReady("写真添付")}
          className="mt-3 flex h-tap-target w-full items-center justify-center gap-2 rounded-input border border-neutral-gray font-semibold"
        >
          <ImageIcon size={18} />
          写真を添付
        </button>

        <h2 className="mb-2 mt-4 font-bold">おすすめハッシュタグ</h2>
        <div className="flex flex-wrap gap-2">
          {suggestedHashtags.map((tag) => {
            const selected = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags((prev) => {
                    const next = new Set(prev);
                    if (next.has(tag)) next.delete(tag);
                    else next.add(tag);
                    return next;
                  })
                }
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  selected ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div className={`mt-4 rounded-card border-[1.5px] bg-white p-3 shadow-card ${riskColor[risk.level]}`}>
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert size={20} />
            炎上リスクチェック：{riskLabels[risk.level]}
          </div>
          {risk.reasons.length > 0 ? (
            <>
              <ul className="ml-8 mt-2 flex flex-col gap-0.5 text-sm">
                {risk.reasons.map((r) => (
                  <li key={r}>・{r}</li>
                ))}
              </ul>
              <label className="ml-8 mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={riskAcknowledged}
                  onChange={(e) => setRiskAcknowledged(e.target.checked)}
                />
                内容を確認しました。このまま投稿します
              </label>
            </>
          ) : (
            <p className="ml-8 mt-1 text-sm text-text-secondary">特に問題のある表現は検出されませんでした</p>
          )}
        </div>

        <h2 className="mb-1 mt-4 font-bold">配信先</h2>
        <label className="flex items-center gap-2 py-2">
          <input type="checkbox" checked={toFacebook} onChange={(e) => setToFacebook(e.target.checked)} />
          <Share2 size={20} className="text-primary-blue" />
          Facebook
        </label>
        <label className="flex items-center gap-2 py-2">
          <input type="checkbox" checked={toLine} onChange={(e) => setToLine(e.target.checked)} />
          <MessageCircle size={20} className="text-brand-green" />
          LINE公式
        </label>

        <button
          onClick={() => setShowPreview(true)}
          disabled={content.trim() === ""}
          className="mt-2 flex h-tap-target w-full items-center justify-center gap-2 rounded-input border border-neutral-gray font-semibold disabled:opacity-40"
        >
          <Eye size={18} />
          投稿イメージを見る
        </button>
        <button
          onClick={publish}
          disabled={posting || !canSubmit}
          className="mt-3 flex h-tap-target w-full items-center justify-center rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
        >
          {posting ? <Loader2 size={20} className="animate-spin" /> : "投稿する"}
        </button>
      </div>

      {showPreview && (
        <PostPreviewOverlay
          content={finalContent}
          toFacebook={toFacebook}
          toLine={toLine}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function PostPreviewOverlay({
  content,
  toFacebook,
  toLine,
  onClose,
}: {
  content: string;
  toFacebook: boolean;
  toLine: boolean;
  onClose: () => void;
}) {
  const authorName = useAppStore((s) => s.profile.displayName);
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-scaffold-bg">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={onClose} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">投稿イメージ</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {toFacebook && <SocialCard icon={Share2} iconColor="bg-primary-blue" label="Facebook" content={content} authorName={authorName} />}
        {toLine && (
          <div className="mt-6">
            <SocialCard icon={MessageCircle} iconColor="bg-brand-green" label="LINE公式" content={content} authorName={authorName} />
          </div>
        )}
        <p className="mt-4 text-xs text-text-secondary">
          イメージはプレビューです。実際の表示は各プラットフォームの仕様により異なる場合があります。
        </p>
      </div>
    </div>
  );
}

function SocialCard({
  icon: Icon,
  iconColor,
  label,
  content,
  authorName,
}: {
  icon: typeof Share2;
  iconColor: string;
  label: string;
  content: string;
  authorName: string;
}) {
  return (
    <div>
      <p className="mb-2 font-bold">{label}</p>
      <div className="rounded-card border-2 border-neutral-gray bg-white">
        <div className="flex items-center gap-2 p-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${iconColor}`}>
            <Icon size={18} />
          </span>
          <div>
            <p className="font-bold">{authorName}</p>
            <p className="text-xs text-text-secondary">今</p>
          </div>
        </div>
        <p className="whitespace-pre-wrap px-3">{content || "（本文なし）"}</p>
        <div className="m-3 flex h-36 items-center justify-center rounded bg-neutral-gray">
          <ImageIcon size={40} className="text-text-secondary" />
        </div>
        <hr className="border-neutral-gray" />
        <div className="flex justify-around p-2 text-text-secondary">
          <span>いいね</span>
          <span>コメント</span>
          <span>シェア</span>
        </div>
      </div>
    </div>
  );
}

export default function PostEditPage() {
  return (
    <SuspenseBoundary>
      <PostEditInner />
    </SuspenseBoundary>
  );
}
