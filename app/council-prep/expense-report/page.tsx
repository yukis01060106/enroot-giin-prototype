"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WizardShell } from "@/components/gikai/WizardShell";
import { useAppStore, useThisMonthExpenses, useThisMonthExpensesByCategory, useThisMonthExpenseTotal } from "@/store/appStore";
import { showToast, showNotReady } from "@/lib/notReady";
import * as gikai from "@/lib/gikaiDraftMockService";

const stepTitles = ["対象期間の確認", "収支報告書プレビュー"];
const secretaryTips = [
  "対象期間を選んでください。記録済みの経費データから自動で集計しますね。",
  "収支報告書ができました。証憑との突合をお忘れなく。",
];
const periods = ["今月", "先月", "今年度"];

export default function ExpenseReportPage() {
  const router = useRouter();
  const addTodo = useAppStore((s) => s.addTodo);
  const thisMonthExpenses = useThisMonthExpenses();
  const thisMonthByCategory = useThisMonthExpensesByCategory();
  const thisMonthTotal = useThisMonthExpenseTotal();

  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [period, setPeriod] = useState(periods[0]);
  const [report, setReport] = useState("");

  async function goNext() {
    if (period !== "今月") {
      showNotReady(`${period}の集計`);
      return;
    }
    if (step === stepTitles.length - 1) {
      finish();
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    setReport(
      gikai.generateSeimuKatsudouhiReport({
        periodLabel: period,
        total: thisMonthTotal,
        byCategory: thisMonthByCategory,
        count: thisMonthExpenses.length,
      })
    );
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
          <div className="flex gap-2">
            <button
              onClick={() => showToast("PDF出力は近日対応予定です（プロトタイプでは未接続の機能です）")}
              className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
            >
              PDF出力
            </button>
            <button
              onClick={() => showToast("Word出力は近日対応予定です（プロトタイプでは未接続の機能です）")}
              className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
            >
              Word出力
            </button>
          </div>
        </div>
      )}
    </WizardShell>
  );
}
