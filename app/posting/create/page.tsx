"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FileText, Sparkles, Share2, MessageCircle } from "lucide-react";
import { WizardShell } from "@/components/gikai/WizardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/store/appStore";
import { recordCategoryLabels } from "@/types/models";
import { generateDraftFromDialogue, generateDraftFromMemo, type PlatformDrafts } from "@/lib/postingAiService";
import { formatMD } from "@/lib/formatDate";

type Mode = "memo" | "dialogue";

/**
 * 「美咲と一緒に作る」SNS発信下書き生成フロー。
 * 記録メモを引用するか、美咲との簡単な対話（トピック＋ポイント入力）から
 * 投稿文を生成する（生成自体はキーワードベースのモック。posting_ai_service参照）。
 */
export default function PostingCreatePage() {
  const router = useRouter();
  const records = useAppStore((s) => s.records);
  const addPostDraft = useAppStore((s) => s.addPostDraft);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [records]
  );

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [detail, setDetail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [generated, setGenerated] = useState<PlatformDrafts | null>(null);
  const [sourceSummary, setSourceSummary] = useState<string | undefined>(undefined);

  const stepTitles =
    mode === "memo"
      ? ["作り方を選ぶ", "メモを選ぶ", "下書き確認"]
      : ["作り方を選ぶ", "内容を教えてください", "下書き確認"];

  const tips = [
    "SNS発信の下書き、一緒に作りましょうか。記録したメモから作るか、私と話しながら作るか選んでくださいね。",
    mode === "memo"
      ? "投稿のもとにするメモを選んでください。"
      : "今日の出来事を教えてください。私が投稿文の形に整えますね。",
    "Facebook向けとLINE公式向け、それぞれの雰囲気に合わせて2種類作ってみました。内容を確認して、次の画面でご自身の言葉に調整してくださいね。",
  ];

  const canAdvance =
    step === 0 ? mode !== null : step === 1 ? (mode === "memo" ? !!selectedRecordId : topic.trim() !== "") : true;

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 1) {
      setStep(0);
      setSelectedRecordId(null);
    }
  }

  function handleNext() {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      setProcessing(true);
      setTimeout(() => {
        if (mode === "memo") {
          const record = sortedRecords.find((r) => r.id === selectedRecordId);
          setGenerated(generateDraftFromMemo(record?.content ?? ""));
          setSourceSummary(record?.content.slice(0, 30));
        } else {
          setGenerated(generateDraftFromDialogue(topic, detail));
          setSourceSummary(topic.trim());
        }
        setProcessing(false);
        setStep(2);
      }, 1200);
      return;
    }
    if (!generated) return;
    const draft = addPostDraft({ content: generated.facebook, lineContent: generated.line, sourceSummary });
    router.push(`/posting/edit?draftId=${draft.id}`);
  }

  return (
    <WizardShell
      title="美咲と一緒に作る"
      stepTitles={stepTitles}
      step={step}
      processing={processing}
      tip={tips[step]}
      canAdvance={canAdvance}
      onBack={handleBack}
      onNext={handleNext}
      backHref="/posting"
    >
      {step === 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode("memo")}
            className={`rounded-card border-2 p-4 text-left transition-colors ${
              mode === "memo" ? "border-brand-green bg-brand-green/5" : "border-neutral-gray bg-white"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <FileText size={20} className="text-brand-green" />
              記録メモから作る
            </div>
            <p className="mt-1 text-sm text-text-secondary">これまで記録したメモを引用して投稿文を作ります</p>
          </button>
          <button
            onClick={() => setMode("dialogue")}
            className={`rounded-card border-2 p-4 text-left transition-colors ${
              mode === "dialogue" ? "border-brand-green bg-brand-green/5" : "border-neutral-gray bg-white"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={20} className="text-brand-green" />
              美咲と話しながら作る
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              今日の出来事を教えていただければ、投稿文の形に整えます
            </p>
          </button>
        </div>
      )}

      {step === 1 && mode === "memo" && (
        sortedRecords.length === 0 ? (
          <EmptyState icon={FileText} message="記録メモがまだありません" actionHint="ホームの「メモ」から記録してみましょう" />
        ) : (
          <div className="flex flex-col gap-2">
            {sortedRecords.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRecordId(r.id)}
                className={`rounded-card border-2 p-3 text-left ${
                  selectedRecordId === r.id ? "border-brand-green bg-brand-green/5" : "border-transparent bg-white shadow-card"
                }`}
              >
                <p className="line-clamp-3">{r.content}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {r.categories[0] ? recordCategoryLabels[r.categories[0]] : ""} ・ {formatMD(new Date(r.createdAt))}
                </p>
              </button>
            ))}
          </div>
        )
      )}

      {step === 1 && mode === "dialogue" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-semibold">今日はどんな出来事について発信しますか？</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例）〇〇小学校での懇談会"
              autoFocus
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold">特に伝えたいポイント（任意）</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="例）参加者からの声、印象に残ったことなど"
              className="w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
      )}

      {step === 2 && generated && (
        <div className="flex flex-col gap-4">
          <div className="rounded-card bg-white shadow-card">
            <div className="flex items-center gap-2 rounded-t-card bg-primary-blue/10 px-3 py-2 font-bold text-primary-blue">
              <Share2 size={16} />
              Facebook向け
            </div>
            <p className="whitespace-pre-wrap p-4">{generated.facebook}</p>
          </div>
          <div className="rounded-card bg-white shadow-card">
            <div className="flex items-center gap-2 rounded-t-card bg-brand-green/10 px-3 py-2 font-bold text-brand-green">
              <MessageCircle size={16} />
              LINE公式向け
            </div>
            <p className="whitespace-pre-wrap p-4">{generated.line}</p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}
