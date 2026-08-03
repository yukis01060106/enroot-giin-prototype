"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Star, X } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { benchmarkPlatforms } from "@/types/models";

export default function BenchmarkAccountsPage() {
  const router = useRouter();
  const accounts = useAppStore((s) => s.benchmarkAccounts);
  const removeBenchmarkAccount = useAppStore((s) => s.removeBenchmarkAccount);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/posting")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">ベンチマークアカウント</h1>
      </header>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-text-secondary">
          発信スタイルの参考にしたいアカウントを登録しておくと、投稿の下書き作成時にAIが文体・トーンの参考にします。
        </p>

        <div className="mt-4 flex-1 overflow-y-auto">
          {accounts.length === 0 ? (
            <EmptyState icon={Star} message="まだ登録されていません" actionHint="下の「アカウントを追加」から登録できます" />
          ) : (
            <div className="flex flex-col gap-2">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-card bg-white p-3 shadow-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-light-green font-bold text-white">
                    {a.platform.slice(0, 1) || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>{a.name}</p>
                    <p className="truncate text-sm text-text-secondary">
                      {[a.platform, a.handle].filter(Boolean).join(" ・ ")}
                    </p>
                    {a.note && <p className="text-xs text-text-secondary">{a.note}</p>}
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                    aria-label="削除"
                    className="text-text-secondary"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setDialogOpen(true)}
          className="h-tap-target rounded-input bg-brand-green font-bold text-white"
        >
          アカウントを追加
        </button>
      </div>

      <AddBenchmarkDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="アカウントを削除"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-3 py-2 text-text-secondary">
              キャンセル
            </button>
            <button
              onClick={() => {
                if (deleteTarget) removeBenchmarkAccount(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="rounded-input bg-error px-4 py-2 font-semibold text-white"
            >
              削除する
            </button>
          </>
        }
      >
        <p className="leading-relaxed">「{deleteTarget?.name}」を削除しますか？</p>
      </Dialog>
    </div>
  );
}

function AddBenchmarkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addBenchmarkAccount = useAppStore((s) => s.addBenchmarkAccount);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>(benchmarkPlatforms[0]);
  const [handle, setHandle] = useState("");
  const [note, setNote] = useState("");

  function reset() {
    setName("");
    setPlatform(benchmarkPlatforms[0]);
    setHandle("");
    setNote("");
  }

  function save() {
    if (!name.trim()) return;
    addBenchmarkAccount({ name: name.trim(), platform, handle: handle.trim() || undefined, note: note.trim() || undefined });
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
      title="ベンチマークアカウントを追加"
      footer={
        <>
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 text-text-secondary">
            キャンセル
          </button>
          <button onClick={save} className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white">
            追加
          </button>
        </>
      }
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="アカウント名 / 議員名"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="h-tap-target rounded-input bg-neutral-gray px-3"
      >
        {benchmarkPlatforms.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="アカウントID（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="参考にしたい点（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
    </Dialog>
  );
}
