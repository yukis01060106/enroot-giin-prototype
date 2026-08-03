"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";
import { SuspenseBoundary } from "@/components/SuspenseBoundary";
import { useAppStore } from "@/store/appStore";
import { formatYen } from "@/lib/currencyFormat";
import { formatMD } from "@/lib/formatDate";

/**
 * 経費の「PDF報告書出力」。サーバー側でのPDF生成基盤を持たない静的SPAのため、
 * ブラウザ標準の印刷機能（印刷ダイアログ→「PDFとして保存」）を使う。
 * window.print()自体は本物の機能で、モックではない。
 */
function ExpenseReportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expenses = useAppStore((s) => s.expenses);
  const profile = useAppStore((s) => s.profile);

  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth());

  const periodExpenses = useMemo(
    () =>
      expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [expenses, year, month]
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of periodExpenses) map[e.category] = (map[e.category] ?? 0) + e.amount;
    return map;
  }, [periodExpenses]);

  const total = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  function csvEscape(value: string): string {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  }

  function downloadCsv() {
    const header = ["日付", "費目", "店名", "メモ", "金額"];
    const rows = periodExpenses.map((e) => {
      const d = new Date(e.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return [dateStr, e.category, e.store ?? "", e.note ?? "", String(e.amount)];
    });
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    // 先頭にBOMを付与しないとExcel(日本語版)で開いた際に文字化けする
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `経費_${year}年${month + 1}月.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="no-print flex h-14 shrink-0 items-center justify-between gap-2 bg-gradient-primary px-2 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => router.push("/expense")} aria-label="戻る" className="shrink-0 rounded-full p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="truncate text-lg font-bold">経費報告書</h1>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 rounded-input bg-white/15 px-3 py-1.5 text-sm font-semibold"
          >
            <FileSpreadsheet size={16} />
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-input bg-white/15 px-3 py-1.5 text-sm font-semibold"
          >
            <Printer size={16} />
            PDF
          </button>
        </div>
      </header>

      <div className="report-print-area flex-1 overflow-y-auto bg-white p-6 print:p-0">
        <h1 className="text-xl font-bold">政務活動費 経費報告書</h1>
        <p className="mt-1 text-text-secondary">
          {year}年{month + 1}月分
        </p>
        <div className="mt-4 flex justify-between text-sm text-text-secondary">
          <span>{profile.councilName}</span>
          <span>{profile.displayName}</span>
        </div>

        <div className="mt-6 rounded-card border border-neutral-gray p-4">
          <p className="font-bold">合計 {formatYen(total)}</p>
          {Object.keys(byCategory).length > 0 && (
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {Object.entries(byCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between">
                  <span>{cat}</span>
                  <span>{formatYen(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-text-primary text-left">
              <th className="py-2">日付</th>
              <th className="py-2">費目</th>
              <th className="py-2">店名・内容</th>
              <th className="py-2 text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            {periodExpenses.map((e) => (
              <tr key={e.id} className="border-b border-neutral-gray">
                <td className="py-2">{formatMD(new Date(e.date))}</td>
                <td className="py-2">{e.category}</td>
                <td className="py-2">
                  {e.store ?? "－"}
                  {e.note ? `（${e.note}）` : ""}
                </td>
                <td className="py-2 text-right">{formatYen(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {periodExpenses.length === 0 && (
          <p className="mt-6 text-center text-text-secondary">この期間の経費記録はありません</p>
        )}

        <p className="mt-8 text-right text-xs text-text-secondary">
          作成日: {formatMD(now)}　En Root ─ 議員エディション
        </p>
      </div>
    </div>
  );
}

export default function ExpenseReportPage() {
  return (
    <SuspenseBoundary>
      <ExpenseReportInner />
    </SuspenseBoundary>
  );
}
