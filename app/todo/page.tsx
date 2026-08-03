"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Circle, CheckCircle2, PartyPopper, ListTodo, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMD } from "@/lib/formatDate";
import type { TodoModel, TodoPriority } from "@/types/models";

/**
 * 「いい感じのToDo UI」の要件整理（Things 3 / Todoist / TickTick等の一般的な
 * パターンを踏まえる）:
 * - 未完了と完了は別ビュー（タブ）に分離し、完了済みは打ち消し線＋淡色で
 *   「終わったものは終わったもの」として視覚的に退場させる
 * - 優先度は色（左のカラーバー＋ドット）で一目で分かるようにする
 * - 完了済みは「いつ終えたか」の月別グルーピングで振り返れるようにする
 *   （直近だけを見せて際限なく伸びないようにする）
 * - 空状態はポジティブなフィードバックにする（「すべて完了しました」等）
 */
const HISTORY_MONTHS = 6;

const priorityStyles: Record<TodoPriority, { border: string; dot: string; label: string }> = {
  high: { border: "border-l-error", dot: "bg-error", label: "高" },
  medium: { border: "border-l-warning", dot: "bg-warning", label: "中" },
  low: { border: "border-l-neutral-gray", dot: "bg-text-secondary", label: "低" },
};

function monthLabel(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sortByDueDate(todos: (TodoModel & { dueDate: string })[]): TodoModel[] {
  return [...todos].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/** 完了トグルは左のチェック丸だけの小さいタップ領域、行の残り（タイトル・期限）を
 * 押すと編集ダイアログが開く。1つの行に「完了にする」と「編集する」の2つの操作を
 * 両立させるための分割。 */
function ActiveRow({ todo, onToggle, onEdit }: { todo: TodoModel; onToggle: () => void; onEdit: () => void }) {
  const style = priorityStyles[todo.priority];
  return (
    <div className={`mb-2 flex items-center gap-1 rounded-card border-l-4 bg-white shadow-card ${style.border}`}>
      <button
        onClick={onToggle}
        aria-label="完了にする"
        className="flex shrink-0 items-center justify-center py-3 pl-3 pr-2"
      >
        <Circle size={22} className="text-text-secondary" />
      </button>
      <button onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate">{todo.title}</p>
          {todo.dueDate && <p className="text-sm text-text-secondary">期限 {formatMD(new Date(todo.dueDate))}</p>}
        </div>
        <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-label={`優先度: ${style.label}`} />
        <ChevronRight size={16} className="shrink-0 text-text-secondary/50" />
      </button>
    </div>
  );
}

function ActiveGroup({
  title,
  todos,
  onToggle,
  onEdit,
  tone,
}: {
  title: string;
  todos: TodoModel[];
  onToggle: (id: string) => void;
  onEdit: (todo: TodoModel) => void;
  tone?: string;
}) {
  if (todos.length === 0) return null;
  return (
    <div className="mb-2">
      <h2 className={`py-2 text-lg font-bold ${tone ?? ""}`}>{title}</h2>
      {todos.map((t) => (
        <ActiveRow key={t.id} todo={t} onToggle={() => onToggle(t.id)} onEdit={() => onEdit(t)} />
      ))}
    </div>
  );
}

function DoneRow({ todo, onToggle }: { todo: TodoModel; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="mb-2 flex w-full items-center gap-3 rounded-card bg-white p-3 text-left opacity-70 shadow-card"
    >
      <CheckCircle2 size={22} className="shrink-0 text-brand-green" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-text-secondary line-through">{todo.title}</p>
        {todo.completedAt && (
          <p className="text-sm text-text-secondary">{formatMD(new Date(todo.completedAt))} に完了</p>
        )}
      </div>
    </button>
  );
}

export default function TodoPage() {
  const router = useRouter();
  const todos = useAppStore((s) => s.todos);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const [tab, setTab] = useState<"active" | "done">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoModel | null>(null);

  const activeTodos = useMemo(() => todos.filter((t) => !t.isCompleted), [todos]);
  const doneTodos = useMemo(() => todos.filter((t) => t.isCompleted), [todos]);

  const { overdueGroup, todayGroup, weekGroup, laterGroup, noDateGroup } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
    const weekEnd = new Date(todayStart.getTime() + 7 * 86400000 - 1);
    const withDate = activeTodos.filter((t): t is TodoModel & { dueDate: string } => !!t.dueDate);
    return {
      overdueGroup: sortByDueDate(withDate.filter((t) => new Date(t.dueDate) < todayStart)),
      todayGroup: sortByDueDate(withDate.filter((t) => new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd)),
      weekGroup: sortByDueDate(withDate.filter((t) => new Date(t.dueDate) > todayEnd && new Date(t.dueDate) <= weekEnd)),
      laterGroup: sortByDueDate(withDate.filter((t) => new Date(t.dueDate) > weekEnd)),
      noDateGroup: activeTodos.filter((t) => !t.dueDate),
    };
  }, [activeTodos]);

  const { doneGroups, hiddenOlderCount } = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - HISTORY_MONTHS);
    const sorted = [...doneTodos].sort(
      (a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
    );
    const recent = sorted.filter((t) => !t.completedAt || new Date(t.completedAt) >= cutoff);
    const groups: { label: string; todos: TodoModel[] }[] = [];
    for (const t of recent) {
      const label = t.completedAt ? monthLabel(new Date(t.completedAt)) : "完了日不明";
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.todos.push(t);
      else groups.push({ label, todos: [t] });
    }
    return { doneGroups: groups, hiddenOlderCount: sorted.length - recent.length };
  }, [doneTodos]);

  function openAddDialog() {
    setEditingTodo(null);
    setDialogOpen(true);
  }
  function openEditDialog(todo: TodoModel) {
    setEditingTodo(todo);
    setDialogOpen(true);
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">やること</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mb-4 flex rounded-input bg-neutral-gray p-1">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 rounded-input py-2 text-sm font-semibold transition-colors ${
              tab === "active" ? "bg-white text-brand-green shadow-card" : "text-text-secondary"
            }`}
          >
            未完了{activeTodos.length > 0 && ` (${activeTodos.length})`}
          </button>
          <button
            onClick={() => setTab("done")}
            className={`flex-1 rounded-input py-2 text-sm font-semibold transition-colors ${
              tab === "done" ? "bg-white text-brand-green shadow-card" : "text-text-secondary"
            }`}
          >
            完了{doneTodos.length > 0 && ` (${doneTodos.length})`}
          </button>
        </div>

        {tab === "active" ? (
          activeTodos.length === 0 ? (
            <EmptyState icon={PartyPopper} message="やることはすべて完了しました！" actionHint="お疲れさまでした" />
          ) : (
            <>
              <ActiveGroup title="期限切れ" todos={overdueGroup} onToggle={toggleTodo} onEdit={openEditDialog} tone="text-error" />
              <ActiveGroup title="今日まで" todos={todayGroup} onToggle={toggleTodo} onEdit={openEditDialog} />
              <ActiveGroup title="今週中" todos={weekGroup} onToggle={toggleTodo} onEdit={openEditDialog} />
              <ActiveGroup title="それ以降" todos={laterGroup} onToggle={toggleTodo} onEdit={openEditDialog} />
              <ActiveGroup title="期限なし" todos={noDateGroup} onToggle={toggleTodo} onEdit={openEditDialog} />
            </>
          )
        ) : doneGroups.length === 0 ? (
          <EmptyState icon={ListTodo} message="完了したやることはまだありません" />
        ) : (
          <>
            <p className="mb-3 text-sm text-text-secondary">直近{HISTORY_MONTHS}ヶ月分を表示しています</p>
            {doneGroups.map((g) => (
              <div key={g.label} className="mb-2">
                <h2 className="py-2 text-lg font-bold">{g.label}</h2>
                {g.todos.map((t) => (
                  <DoneRow key={t.id} todo={t} onToggle={() => toggleTodo(t.id)} />
                ))}
              </div>
            ))}
            {hiddenOlderCount > 0 && (
              <p className="py-2 text-center text-sm text-text-secondary">
                これより古い完了済み{hiddenOlderCount}件は表示していません
              </p>
            )}
          </>
        )}
      </div>

      <button
        onClick={openAddDialog}
        className="absolute bottom-5 right-5 flex h-14 items-center gap-2 rounded-full bg-brand-green px-5 font-bold text-white shadow-raised"
      >
        <Plus size={20} />
        やることを追加する
      </button>

      <TodoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingTodo={editingTodo} />
    </div>
  );
}

function TodoFormDialog({
  open,
  onOpenChange,
  editingTodo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTodo: TodoModel | null;
}) {
  const addTodo = useAppStore((s) => s.addTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const removeTodo = useAppStore((s) => s.removeTodo);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");

  // ダイアログが閉→開に切り替わった瞬間だけ、追加なら空・編集なら現在値で
  // フォームを初期化する（レンダー中にstateを更新する「前回値との比較」パターン。
  // useEffectで行うと余分なレンダーが挟まるため、このセッションで一貫して
  // 避けている）。
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle(editingTodo?.title ?? "");
      setDueDate(editingTodo?.dueDate ? toDateInputValue(new Date(editingTodo.dueDate)) : "");
      setPriority(editingTodo?.priority ?? "medium");
    }
  }

  function save() {
    if (!title.trim()) return;
    const dueDateIso = dueDate ? new Date(dueDate).toISOString() : undefined;
    if (editingTodo) {
      updateTodo(editingTodo.id, { title: title.trim(), dueDate: dueDateIso ?? null, priority });
    } else {
      addTodo({ title: title.trim(), dueDate: dueDateIso, priority });
    }
    onOpenChange(false);
  }

  function handleDelete() {
    if (editingTodo) removeTodo(editingTodo.id);
    onOpenChange(false);
  }

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const nextWeek = new Date(today.getTime() + 7 * 86400000);
  const datePresets = [
    { label: "今日", value: toDateInputValue(today) },
    { label: "明日", value: toDateInputValue(tomorrow) },
    { label: "来週", value: toDateInputValue(nextWeek) },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingTodo ? "やることを編集" : "やることを追加する"}
      footer={
        <>
          {editingTodo && (
            <button onClick={handleDelete} className="mr-auto px-3 py-2 font-semibold text-error">
              削除
            </button>
          )}
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 text-text-secondary">
            キャンセル
          </button>
          <button onClick={save} className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white">
            保存
          </button>
        </>
      }
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="内容"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="h-tap-target rounded-input bg-neutral-gray px-3"
      />
      <div className="flex gap-2">
        {datePresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setDueDate(preset.value)}
            className={`flex-1 rounded-chip border px-3 py-1.5 text-sm font-semibold ${
              dueDate === preset.value ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-neutral-gray text-text-secondary"
            }`}
          >
            {preset.label}
          </button>
        ))}
        {dueDate && (
          <button
            type="button"
            onClick={() => setDueDate("")}
            className="rounded-chip border border-neutral-gray px-3 py-1.5 text-sm font-semibold text-text-secondary"
          >
            期限なし
          </button>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-text-secondary">優先度</p>
        <div className="flex gap-2">
          {(["high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 rounded-input border-2 py-2 text-sm font-semibold ${
                priority === p
                  ? `${priorityStyles[p].border.replace("border-l-", "border-")} bg-neutral-gray`
                  : "border-transparent bg-neutral-gray text-text-secondary"
              }`}
            >
              {priorityStyles[p].label}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
