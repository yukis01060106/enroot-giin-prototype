"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, FolderArchive } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Dialog } from "@/components/ui/Dialog";
import { formatYMD } from "@/lib/formatDate";
import { gikaiTemplateTypes, type GikaiTemplateType } from "@/types/models";

export default function TemplatesPage() {
  const router = useRouter();
  const templates = useAppStore((s) => s.gikaiTemplates);
  const removeGikaiTemplate = useAppStore((s) => s.removeGikaiTemplate);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/council-prep")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">テンプレート管理</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {templates.length === 0 ? (
          <EmptyState
            icon={FolderArchive}
            message="まだテンプレートがありません"
            actionHint="右下の「新規テンプレート」から作成できます"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-card bg-white p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <span className="rounded-chip bg-neutral-gray px-2 py-0.5 text-xs">
                    {gikaiTemplateTypes[t.templateType as GikaiTemplateType] ?? t.templateType}
                  </span>
                  <button
                    aria-label="削除"
                    onClick={() => setDeleteTarget({ id: t.id, name: t.templateName })}
                    className="text-text-secondary"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="mt-1 font-bold">{t.templateName}</p>
                {t.councilName && <p className="text-sm text-text-secondary">{t.councilName}</p>}
                <p className="mt-2">{t.body}</p>
                <p className="mt-2 text-xs text-text-secondary">
                  作成日：{formatYMD(new Date(t.createdAt))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setSheetOpen(true)}
        className="absolute bottom-5 right-5 flex h-14 items-center gap-2 rounded-full bg-brand-green px-5 font-bold text-white shadow-raised"
      >
        <Plus size={20} />
        新規テンプレート
      </button>

      <CreateTemplateSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="テンプレートを削除"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-3 py-2 text-text-secondary">
              キャンセル
            </button>
            <button
              onClick={() => {
                if (deleteTarget) removeGikaiTemplate(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="rounded-input bg-error px-4 py-2 font-semibold text-white"
            >
              削除する
            </button>
          </>
        }
      >
        <p className="leading-relaxed">
          「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
        </p>
      </Dialog>
    </div>
  );
}

function CreateTemplateSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addGikaiTemplate = useAppStore((s) => s.addGikaiTemplate);
  const [type, setType] = useState<GikaiTemplateType>("tsukoku_sho");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  function reset() {
    setType("tsukoku_sho");
    setName("");
    setBody("");
  }

  function save() {
    if (!name.trim()) return;
    addGikaiTemplate({
      templateType: type,
      templateName: name.trim(),
      body: body.trim() || "（メモなし）",
    });
    reset();
    onOpenChange(false);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <div className="flex flex-col gap-4 pb-2">
        <h2 className="text-lg font-bold">新規テンプレート</h2>
        <div>
          <p className="mb-2 font-semibold">種別</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(gikaiTemplateTypes) as [GikaiTemplateType, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  type === key ? "bg-brand-green text-white" : "bg-neutral-gray text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-semibold">テンプレート名 *</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：大牟田市議会 標準フォーマット"
            className="h-tap-target w-full rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <div>
          <p className="mb-2 font-semibold">メモ・書式の要点</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="例：件名・要旨・項目の3段構成、提出は開会3日前まで"
            rows={3}
            className="w-full rounded-input bg-neutral-gray p-3 outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="h-tap-target rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
        >
          保存する
        </button>
      </div>
    </BottomSheet>
  );
}
