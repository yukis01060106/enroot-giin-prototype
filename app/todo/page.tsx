"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Dialog } from "@/components/ui/Dialog";
import type { TodoModel } from "@/types/models";

function TodoGroup({ title, todos }: { title: string; todos: TodoModel[] }) {
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  if (todos.length === 0) return null;
  return (
    <div className="mb-2">
      <h2 className="py-2 text-lg font-bold">{title}</h2>
      {todos.map((t) => (
        <label
          key={t.id}
          className="mb-2 flex items-center gap-3 rounded-card bg-white p-3 shadow-card"
        >
          <input type="checkbox" checked={t.isCompleted} onChange={() => toggleTodo(t.id)} className="h-5 w-5" />
          <div>
            <p className={t.isCompleted ? "text-text-secondary line-through" : ""}>{t.title}</p>
            {t.dueDate && (
              <p className="text-sm text-text-secondary">
                {new Date(t.dueDate).getMonth() + 1}月{new Date(t.dueDate).getDate()}日
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

export default function TodoPage() {
  const router = useRouter();
  const todos = useAppStore((s) => s.todos);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { todayGroup, weekGroup, noDateGroup } = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);
    return {
      todayGroup: todos.filter((t) => t.dueDate && new Date(t.dueDate) <= todayEnd),
      weekGroup: todos.filter(
        (t) => t.dueDate && new Date(t.dueDate) > todayEnd && new Date(t.dueDate) <= weekEnd
      ),
      noDateGroup: todos.filter((t) => !t.dueDate),
    };
  }, [todos]);

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">やること</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <TodoGroup title="今日まで" todos={todayGroup} />
        <TodoGroup title="今週中" todos={weekGroup} />
        <TodoGroup title="期限なし" todos={noDateGroup} />
      </div>

      <button
        onClick={() => setDialogOpen(true)}
        className="absolute bottom-5 right-5 flex h-14 items-center gap-2 rounded-full bg-brand-green px-5 font-bold text-white shadow-raised"
      >
        <Plus size={20} />
        やることを追加する
      </button>

      <AddTodoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function AddTodoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addTodo = useAppStore((s) => s.addTodo);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setTitle("");
    setDueDate("");
  }

  function save() {
    if (!title.trim()) return;
    addTodo({
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="やることを追加する"
      footer={
        <>
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
    </Dialog>
  );
}
