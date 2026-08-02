"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, FileText, IdCard, Receipt, Megaphone } from "lucide-react";
import {
  useAppStore,
  useThisMonthExpenseTotal,
  useThisMonthExpensesByCategory,
  weeklyPostingTarget,
} from "@/store/appStore";
import { formatYen } from "@/lib/currencyFormat";

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * 「活用レポート」。メモ・繋がり・投稿・経費のこれまでの本物の記録データから
 * 集計する（AI生成ではない、単純な月次サマリー）。
 */
export default function UsageReportPage() {
  const router = useRouter();
  const records = useAppStore((s) => s.records);
  const persons = useAppStore((s) => s.persons);
  const weeklyFacebookCount = useAppStore((s) => s.weeklyFacebookCount);
  const weeklyLineCount = useAppStore((s) => s.weeklyLineCount);
  const monthExpenseTotal = useThisMonthExpenseTotal();
  const monthExpenseByCategory = useThisMonthExpensesByCategory();

  const monthRecords = useMemo(() => records.filter((r) => isThisMonth(r.createdAt)), [records]);
  const monthPersons = useMemo(() => persons.filter((p) => isThisMonth(p.createdAt)), [persons]);
  const now = new Date();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">活用レポート</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-text-secondary">
          {now.getFullYear()}年{now.getMonth() + 1}月のご利用状況です
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-white p-4 shadow-card">
            <FileText size={22} className="text-primary-blue" />
            <p className="mt-2 text-2xl font-bold">{monthRecords.length}件</p>
            <p className="text-sm text-text-secondary">今月の記録</p>
          </div>
          <div className="rounded-card bg-white p-4 shadow-card">
            <IdCard size={22} className="text-brand-green" />
            <p className="mt-2 text-2xl font-bold">{monthPersons.length}件</p>
            <p className="text-sm text-text-secondary">今月増えた繋がり</p>
          </div>
          <div className="rounded-card bg-white p-4 shadow-card">
            <Megaphone size={22} className="text-accent-rose" />
            <p className="mt-2 text-2xl font-bold">{weeklyFacebookCount + weeklyLineCount}件</p>
            <p className="text-sm text-text-secondary">今週のSNS発信（目標{weeklyPostingTarget}件）</p>
          </div>
          <div className="rounded-card bg-white p-4 shadow-card">
            <Receipt size={22} className="text-accent-amber" />
            <p className="mt-2 text-2xl font-bold">{formatYen(monthExpenseTotal)}</p>
            <p className="text-sm text-text-secondary">今月の経費</p>
          </div>
        </div>

        {Object.keys(monthExpenseByCategory).length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">経費の内訳</h2>
            <div className="flex flex-col gap-1 rounded-card bg-white p-4 shadow-card">
              {Object.entries(monthExpenseByCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between py-1">
                  <span>{cat}</span>
                  <span className="font-semibold">{formatYen(amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="mb-2 mt-6 text-lg font-bold">総計</h2>
        <div className="rounded-card bg-white p-4 shadow-card">
          <div className="flex justify-between py-1">
            <span>累計の記録件数</span>
            <span className="font-semibold">{records.length}件</span>
          </div>
          <div className="flex justify-between py-1">
            <span>累計の名刺管理件数</span>
            <span className="font-semibold">{persons.length}件</span>
          </div>
        </div>
      </div>
    </div>
  );
}
