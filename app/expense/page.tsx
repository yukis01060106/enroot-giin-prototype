"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  FileDown,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from "lucide-react";
import { useAppStore, monthlyExpenseBudget } from "@/store/appStore";
import { formatYen } from "@/lib/currencyFormat";
import { formatMD } from "@/lib/formatDate";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart, PieChartLegend, colorForKey } from "@/components/ui/PieChart";
import { Dialog } from "@/components/ui/Dialog";
import { expenseCategories } from "@/types/models";
import type { ExpenseModel } from "@/types/models";

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function categoryColor(category: string): string {
  return colorForKey(category, expenseCategories as unknown as string[]);
}

export default function ExpensePage() {
  const router = useRouter();
  const expenses = useAppStore((s) => s.expenses);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseModel | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

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

  function jumpToCurrentMonth() {
    setActiveCategory(null);
    const now = new Date();
    setPeriod({ year: now.getFullYear(), month: now.getMonth() });
  }

  function openAddDialog() {
    setEditingExpense(null);
    setDialogOpen(true);
  }
  function openEditDialog(expense: ExpenseModel) {
    setEditingExpense(expense);
    setDialogOpen(true);
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">経費</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="flex items-center justify-between rounded-card bg-white px-2 py-1.5 shadow-card">
          <button onClick={() => changeMonth(-1)} aria-label="前の月" className="p-2 text-text-secondary">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthPickerOpen(true)} className="font-bold underline decoration-dotted underline-offset-4">
              {period.year}年{period.month + 1}月
            </button>
            {isCurrentMonth ? (
              <span className="rounded-chip bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
                今月
              </span>
            ) : (
              <button
                onClick={jumpToCurrentMonth}
                className="rounded-chip bg-neutral-gray px-2 py-0.5 text-xs font-semibold text-text-secondary"
              >
                今月に戻る
              </button>
            )}
          </div>
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
              className={`h-full rounded-full transition-[width] ${remaining >= 0 ? "bg-brand-green" : "bg-error"}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className={`mt-1 text-sm ${remaining >= 0 ? "text-text-secondary" : "text-error"}`}>
            {remaining >= 0 ? `残高 ${formatYen(remaining)}` : `${formatYen(-remaining)} 超過しています`}
          </p>
          {categories.length > 0 && (
            <div className="mt-4 flex items-start gap-4">
              <PieChart data={byCategory} size={100} keyOrder={expenseCategories as unknown as string[]} />
              <div className="flex-1">
                <PieChartLegend data={byCategory} keyOrder={expenseCategories as unknown as string[]} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => router.push("/expense/scan")}
            className="flex h-tap-target flex-1 items-center justify-center gap-2 rounded-input bg-brand-green font-bold text-white"
          >
            <Camera size={20} />
            レシートを撮影
          </button>
          <button
            onClick={openAddDialog}
            aria-label="手入力で経費を追加"
            className="flex h-tap-target items-center justify-center gap-2 rounded-input border border-primary-blue px-4 font-bold text-primary-blue"
          >
            <Plus size={20} />
            手入力
          </button>
        </div>

        <div className="mb-2 mt-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">経費一覧</h2>
          <button
            onClick={() => router.push(`/expense/report?year=${period.year}&month=${period.month}`)}
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
                className={`flex shrink-0 items-center gap-1.5 rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  activeCategory === c ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: activeCategory === c ? "#ffffff" : categoryColor(c) }}
                />
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            message={
              periodExpenses.length === 0
                ? "この月の経費はまだありません"
                : "この費目の経費はありません"
            }
            actionHint={periodExpenses.length === 0 ? "レシート撮影か手入力で記録してみましょう" : undefined}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => openEditDialog(e)}
                className="flex w-full items-center gap-3 rounded-card bg-white p-3 text-left shadow-card"
              >
                {e.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-input object-cover" />
                ) : (
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input"
                    style={{ backgroundColor: `${categoryColor(e.category)}1a` }}
                  >
                    <Receipt size={20} style={{ color: categoryColor(e.category) }} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate">{e.store ?? e.category}</p>
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: categoryColor(e.category) }}
                    />
                    <span className="truncate">
                      {e.category} ・ {formatMD(new Date(e.date))}
                      {e.note ? ` ・ ${e.note}` : ""}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 font-bold">{formatYen(e.amount)}</p>
                <ChevronRight size={16} className="shrink-0 text-text-secondary/50" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingExpense={editingExpense} />
      <MonthPickerDialog
        open={monthPickerOpen}
        onOpenChange={setMonthPickerOpen}
        period={period}
        onSelect={(p) => {
          setActiveCategory(null);
          setPeriod(p);
          setMonthPickerOpen(false);
        }}
      />
    </div>
  );
}

const monthLabels = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

/**
 * 「‹›」の1ヶ月ずつの送りだけだと去年以前に戻るのに何度もタップが必要になる
 * （ユーザー指摘）ため、年を跨いで一気にジャンプできる年月ピッカーを別途用意する。
 * 1ヶ月ずつの送りボタンもよく使う操作なので残しつつ、こちらは「遠くへ跳ぶ」用途。
 */
function MonthPickerDialog({
  open,
  onOpenChange,
  period,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: { year: number; month: number };
  onSelect: (period: { year: number; month: number }) => void;
}) {
  const [pickerYear, setPickerYear] = useState(period.year);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPickerYear(period.year);
  }

  const now = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="年月を選ぶ">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPickerYear((y) => y - 1)}
          aria-label="前の年"
          className="p-2 text-text-secondary"
        >
          <ChevronsLeft size={20} />
        </button>
        <span className="text-lg font-bold">{pickerYear}年</span>
        <button
          onClick={() => setPickerYear((y) => y + 1)}
          aria-label="次の年"
          className="p-2 text-text-secondary"
        >
          <ChevronsRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {monthLabels.map((label, i) => {
          const isSelected = pickerYear === period.year && i === period.month;
          const isThisMonth = pickerYear === now.getFullYear() && i === now.getMonth();
          return (
            <button
              key={label}
              onClick={() => onSelect({ year: pickerYear, month: i })}
              className={`rounded-input py-2.5 text-sm font-semibold ${
                isSelected
                  ? "bg-brand-green text-white"
                  : isThisMonth
                    ? "bg-brand-green/10 text-brand-green"
                    : "bg-neutral-gray text-text-secondary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

function ExpenseFormDialog({
  open,
  onOpenChange,
  editingExpense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: ExpenseModel | null;
}) {
  const addExpense = useAppStore((s) => s.addExpense);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const removeExpense = useAppStore((s) => s.removeExpense);
  const [category, setCategory] = useState<string>(expenseCategories[0]);
  const [amount, setAmount] = useState("");
  const [store, setStore] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  // ダイアログが閉→開に切り替わった瞬間だけフォームを初期化する
  // （todo/contacts/postingで使ってきた「前回値との比較」パターン）。
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCategory(editingExpense?.category ?? expenseCategories[0]);
      setAmount(editingExpense ? String(editingExpense.amount) : "");
      setStore(editingExpense?.store ?? "");
      setNote(editingExpense?.note ?? "");
      setDate(toDateInputValue(editingExpense ? new Date(editingExpense.date) : new Date()));
    }
  }

  const amountNum = parseInt(amount, 10);
  const isValid = !!amountNum && amountNum > 0;

  function save() {
    if (!isValid) return;
    const dateIso = date ? new Date(date).toISOString() : undefined;
    if (editingExpense) {
      updateExpense(editingExpense.id, {
        category,
        amount: amountNum,
        store: store.trim() || undefined,
        note: note.trim() || undefined,
        date: dateIso,
      });
    } else {
      addExpense({
        category,
        amount: amountNum,
        store: store.trim() || undefined,
        note: note.trim() || undefined,
        date: dateIso,
      });
    }
    onOpenChange(false);
  }

  function handleDelete() {
    if (editingExpense) removeExpense(editingExpense.id);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingExpense ? "経費を編集" : "経費を手入力で追加"}
      footer={
        <>
          {editingExpense && (
            <button onClick={handleDelete} className="mr-auto px-3 py-2 font-semibold text-error">
              削除
            </button>
          )}
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 text-text-secondary">
            キャンセル
          </button>
          <button
            onClick={save}
            disabled={!isValid}
            className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white disabled:opacity-40"
          >
            保存
          </button>
        </>
      }
    >
      {editingExpense?.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={editingExpense.photoUrl} alt="レシート" className="h-32 w-full rounded-card object-cover" />
      )}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-text-secondary">費目</p>
        <div className="flex flex-wrap gap-2">
          {expenseCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-sm font-semibold ${
                category === c ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-neutral-gray text-text-secondary"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(c) }} />
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-text-secondary">金額（円）</label>
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="h-tap-target w-full rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-text-secondary">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-tap-target w-full rounded-input bg-neutral-gray px-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-text-secondary">店名（任意）</label>
        <input
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="h-tap-target w-full rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-text-secondary">メモ（任意）</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-tap-target w-full rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>
    </Dialog>
  );
}
