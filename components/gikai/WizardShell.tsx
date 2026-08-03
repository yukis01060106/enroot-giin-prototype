"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SecretaryTipBubble } from "@/components/SecretaryTipBubble";
import { AiDisclosureBanner } from "@/components/AiDisclosureBanner";

/**
 * 3つのウィザード（一般質問/視察報告書/政務活動費）に共通するステップUIの殻。
 * ippan_shitsumon_flow_view.dart 等3ファイルでほぼ同一だった構造を1つにまとめた
 * （Flutter版では各ファイルにコピーされていたが、Next.js移植では素直に共通化する）。
 */
export function WizardShell({
  title,
  stepTitles,
  step,
  processing,
  tip,
  canAdvance,
  onBack,
  onNext,
  backHref = "/council-prep",
  showAiDisclosureOnLastStep = false,
  children,
}: {
  title: string;
  stepTitles: string[];
  step: number;
  processing: boolean;
  tip: string;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  backHref?: string;
  /** 最終ステップがAIによる生成文章のプレビューである場合にtrue（政活費報告書のような
   * 実データの機械的な集計のみのステップでは、AI生成物ではないためfalseのままにする）。 */
  showAiDisclosureOnLastStep?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isLastStep = step === stepTitles.length - 1;

  return (
    <div className="flex h-full flex-col">
      <header className="no-print flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push(backHref)} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="truncate text-lg font-bold">{title}</h1>
      </header>

      <div className="no-print shrink-0 px-4 pb-2 pt-3">
        <p className="font-bold">
          ステップ {step + 1} / {stepTitles.length}：{stepTitles[step]}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-gray">
          <div
            className="h-full rounded-full bg-brand-green transition-all"
            style={{ width: `${((step + 1) / stepTitles.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="report-print-area flex-1 overflow-y-auto px-4 pb-4">
        <div className="no-print">
          <SecretaryTipBubble text={tip} />
        </div>
        {showAiDisclosureOnLastStep && isLastStep && !processing && (
          <div className="no-print mt-3">
            <AiDisclosureBanner />
          </div>
        )}
        <div className="mt-4">
          {processing ? (
            <div className="no-print flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-brand-green" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      <div className="no-print flex shrink-0 gap-3 px-4 pb-4 pt-2">
        {step > 0 && !processing && (
          <button
            onClick={onBack}
            className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
          >
            戻る
          </button>
        )}
        <button
          onClick={onNext}
          disabled={processing || !canAdvance}
          className="h-tap-target flex-[2] rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
        >
          {isLastStep ? "完了" : "次へ"}
        </button>
      </div>
    </div>
  );
}
