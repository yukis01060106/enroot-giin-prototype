"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { WizardShell } from "@/components/gikai/WizardShell";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import * as gikai from "@/lib/gikaiDraftMockService";

const stepTitles = ["対象期間の確認", "収支報告書プレビュー"];
const secretaryTips = [
  "対象期間を選んでください。記録済みの経費データから自動で集計しますね。",
  "収支報告書ができました。証憑との突合をお忘れなく。",
];
const periods = ["今月", "先月", "今年度"] as const;
type Period = (typeof periods)[number];

/** 「今年度」は4月始まり・翌年3月末までの日本の年度基準。 */
function periodRange(period: Period, now: Date): { start: Date; end: Date } {
  if (period === "今月") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  if (period === "先月") {
    return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  const fiscalYearStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { start: new Date(fiscalYearStart, 3, 1), end: new Date(fiscalYearStart + 1, 3, 1) };
}

export default function ExpenseReportPage() {
  const router = useRouter();
  const addTodo = useAppStore((s) => s.addTodo);
  const expenses = useAppStore((s) => s.expenses);

  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [period, setPeriod] = useState<Period>(periods[0]);
  const [report, setReport] = useState("");

  const { total, byCategory, count } = useMemo(() => {
    const { start, end } = periodRange(period, new Date());
    const target = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d < end;
    });
    const byCat: Record<string, number> = {};
    for (const e of target) byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
    return { total: target.reduce((sum, e) => sum + e.amount, 0), byCategory: byCat, count: target.length };
  }, [expenses, period]);

  async function goNext() {
    if (step === stepTitles.length - 1) {
      finish();
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    setReport(gikai.generateSeimuKatsudouhiReport({ periodLabel: period, total, byCategory, count }));
    setProcessing(false);
    setStep((s) => s + 1);
  }

  function finish() {
    addTodo({
      title: `政務活動費収支報告書（${period}分）の提出`,
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    });
    router.push("/council-prep");
    showToast("収支報告書の草案が完成しました。提出のToDoを追加しました。");
  }

  return (
    <WizardShell
      title="政務活動費収支報告書"
      stepTitles={stepTitles}
      step={step}
      processing={processing}
      tip={secretaryTips[step]}
      canAdvance
      onBack={() => setStep((s) => s - 1)}
      onNext={goNext}
    >
      {step === 0 && (
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                period === p ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <div className="whitespace-pre-wrap rounded-card bg-white p-4 leading-relaxed shadow-card">
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
