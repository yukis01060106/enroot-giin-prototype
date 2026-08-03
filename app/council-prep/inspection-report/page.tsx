"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WizardShell } from "@/components/gikai/WizardShell";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import * as gikai from "@/lib/gikaiDraftMockService";

const stepTitles = ["視察の概要", "現地メモの選択", "報告書プレビュー"];
const secretaryTips = [
  "視察先と目的を教えてください。あとで報告書の書式に自動反映します。",
  "視察中に記録したメモがあれば選んでください。所感として報告書に盛り込みますね。",
  "報告書の草案ができました。内容を確認・編集してください。",
];

export default function InspectionReportPage() {
  const router = useRouter();
  const records = useAppStore((s) => s.records);
  const addTodo = useAppStore((s) => s.addTodo);

  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [report, setReport] = useState("");

  const canAdvance = step === 0 ? destination.trim() !== "" && purpose.trim() !== "" : true;

  async function goNext() {
    if (step === stepTitles.length - 1) {
      finish();
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    if (step === 1) {
      const notes = records.filter((r) => selectedIds.has(r.id)).map((r) => r.content);
      setReport(
        gikai.generateInspectionReport({ destination, date: new Date(), purpose, notes })
      );
    }
    setProcessing(false);
    setStep((s) => s + 1);
  }

  function finish() {
    addTodo({ title: `「${destination}」視察報告書の提出`, dueDate: new Date(Date.now() + 5 * 86400000).toISOString() });
    router.push("/council-prep");
    showToast("視察報告書の草案が完成しました。提出のToDoを追加しました。");
  }

  function toggleRecord(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <WizardShell
      title="視察報告書"
      stepTitles={stepTitles}
      step={step}
      processing={processing}
      tip={secretaryTips[step]}
      canAdvance={canAdvance}
      onBack={() => setStep((s) => s - 1)}
      onNext={goNext}
      showAiDisclosureOnLastStep
    >
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 font-bold">視察先</p>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例：〇〇市 子育て支援センター"
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <p className="mb-2 font-bold">目的</p>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="例：子育て支援施策の先進事例調査"
              rows={2}
              className="w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="mb-2 font-bold">現地メモ（複数選択可）</p>
          {records.length === 0 ? (
            <p className="text-text-secondary">メモがまだありません。所感なしで報告書を作成します。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {records.map((r) => {
                const selected = selectedIds.has(r.id);
                const label = r.content.length > 16 ? `${r.content.slice(0, 16)}…` : r.content;
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleRecord(r.id)}
                    className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                      selected ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            rows={12}
            className="no-print w-full rounded-card bg-white p-4 leading-relaxed shadow-card outline-none"
          />
          {/* textareaは印刷時にレイアウトが崩れる（一部ブラウザで空欄・切れる）ため、
              印刷時だけ現在の内容を通常のテキストとして表示する */}
          <div className="hidden whitespace-pre-wrap rounded-card bg-white p-4 leading-relaxed print:block">
            {report}
          </div>
          <div className="no-print flex gap-2">
            <button
              onClick={() => window.print()}
              className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
            >
              PDF出力
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(report);
                showToast("テキストをコピーしました");
              }}
              className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
            >
              テキストをコピー
            </button>
          </div>
        </div>
      )}
    </WizardShell>
  );
}
