"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Camera, FileDown, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore, monthlyExpenseBudget } from "@/store/appStore";
import { formatYen } from "@/lib/currencyFormat";
import { formatMD } from "@/lib/formatDate";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart, PieChartLegend } from "@/components/ui/PieChart";
import { showNotReady } from "@/lib/notReady";

export default function ExpensePage() {
  const router = useRouter();
  const expenses = useAppStore((s) => s.expenses);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return period.year === now.getFullYear() && period.month === now.getMonth();
  }, [period]);

  const periodExpenses = useMemo(
    () =>
      expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === period.year && d.getMonth() === period.month;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, period]
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of periodExpenses) map[e.category] = (map[e.category] ?? 0) + e.amount;
    return map;
  }, [periodExpenses]);

  const total = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = monthlyExpenseBudget - total;
  const progress = Math.min(Math.max(total / monthlyExpenseBudget, 0), 1);
  const categories = Object.keys(byCategory);

  const filtered = useMemo(
    () => (activeCategory ? periodExpenses.filter((e) => e.category === activeCategory) : periodExpenses),
    [periodExpenses, activeCategory]
  );

  function changeMonth(delta: number) {
    setActiveCategory(null);
    setPeriod((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">経費</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between rounded-card bg-white px-2 py-1.5 shadow-card">
          <button onClick={() => changeMonth(-1)} aria-label="前の月" className="p-2 text-text-secondary">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">
            {period.year}年{period.month + 1}月{isCurrentMonth && "（今月）"}
          </span>
          <button onClick={() => changeMonth(1)} aria-label="次の月" className="p-2 text-text-secondary">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mt-3 rounded-card bg-white p-4 shadow-card">
          <p className="text-lg font-bold">サマリー</p>
          <p className="mt-3">
            使用額 {formatYen(total)} ／ 上限 {formatYen(monthlyExpenseBudget)}
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-gray">
            <div
              className={`h-full rounded-full ${remaining >= 0 ? "bg-brand-green" : "bg-error"}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className={`mt-1 text-sm ${remaining >= 0 ? "text-text-secondary" : "text-error"}`}>
            {remaining >= 0 ? `残高 ${formatYen(remaining)}` : `${formatYen(-remaining)} 超過しています`}
          </p>
          {categories.length > 0 && (
            <div className="mt-4 flex items-start gap-4">
              <PieChart data={byCategory} size={100} />
              <div className="flex-1">
                <PieChartLegend data={byCategory} />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/expense/scan")}
          className="mt-4 flex h-tap-target w-full items-center justify-center gap-2 rounded-input bg-brand-green font-bold text-white"
        >
          <Camera size={20} />
          レシートを撮影
        </button>

        <div className="mb-2 mt-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">経費一覧</h2>
          <button
            onClick={() => showNotReady("PDF報告書出力")}
            className="flex items-center gap-1 text-sm font-semibold text-primary-blue"
          >
            <FileDown size={16} />
            報告書を出力
          </button>
        </div>

        {categories.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-chip px-3 py-1.5 text-sm font-semibold ${
                activeCategory === null ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
              }`}
            >
              すべて
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  activeCategory === c ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} message="この月の経費はまだありません" actionHint="上の「レシートを撮影」から記録してみましょう" />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-card bg-white p-3 shadow-card">
                {e.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-input object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p>{e.store ?? e.category}</p>
                  <p className="text-sm text-text-secondary">
                    {e.category} ・ {formatMD(new Date(e.date))}
                    {e.note ? ` ・ ${e.note}` : ""}
                  </p>
                </div>
                <p className="font-bold">{formatYen(e.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
