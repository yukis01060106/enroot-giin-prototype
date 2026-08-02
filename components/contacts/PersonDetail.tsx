"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Phone, Mail, Pencil } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Dialog } from "@/components/ui/Dialog";
import { formatYMD } from "@/lib/formatDate";

const presetTags = ["町内会", "PTA", "商工会", "後援会", "支援者", "議員", "行政"];

export function PersonDetail({ personId }: { personId: string }) {
  const router = useRouter();
  const person = useAppStore((s) => s.persons.find((p) => p.id === personId));
  // .filter()を直接セレクタで呼ぶと毎回新しい配列参照が返り無限レンダーになる
  // （Phase 0で踏んだのと同じ罠）ため、生の配列を選んでuseMemoでフィルタする。
  const allRecords = useAppStore((s) => s.records);
  const records = useMemo(
    () => allRecords.filter((r) => r.relatedPersonId === personId),
    [allRecords, personId]
  );
  const updatePersonTags = useAppStore((s) => s.updatePersonTags);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);

  if (!person) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-text-secondary">この人物は見つかりませんでした。</p>
        <button onClick={() => router.push("/contacts")} className="font-semibold text-primary-blue">
          一覧へ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-primary-blue px-2 text-white">
        <button onClick={() => router.push("/contacts")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="truncate text-lg font-bold">{person.name}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-card bg-white p-4 shadow-card">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-blue/12 text-xl font-bold text-primary-blue">
              {person.name.slice(0, 1) || "?"}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold">{person.name}</p>
              {(person.organization || person.title) && (
                <p className="truncate text-text-secondary">
                  {[person.organization, person.title].filter(Boolean).join(" / ")}
                </p>
              )}
            </div>
          </div>
          {(person.phone || person.email) && (
            <div className="mt-5 flex gap-2.5">
              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-input bg-brand-green/10 py-3 font-semibold text-brand-green"
                >
                  <Phone size={20} />
                  電話
                </a>
              )}
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-input bg-primary-blue/10 py-3 font-semibold text-primary-blue"
                >
                  <Mail size={20} />
                  メール
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mb-2 mt-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">タグ</h2>
          <button
            className="flex items-center gap-1 text-sm font-semibold text-primary-blue"
            onClick={() => {
              setDraftTags(person.tags);
              setTagDialogOpen(true);
            }}
          >
            <Pencil size={16} />
            編集
          </button>
        </div>
        {person.tags.length === 0 ? (
          <p className="text-text-secondary">タグはまだありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {person.tags.map((t) => (
              <span
                key={t}
                className="rounded-chip bg-brand-green/10 px-3 py-1.5 text-sm font-semibold text-brand-green"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <h2 className="mb-2 mt-5 text-lg font-bold">接触履歴</h2>
        <div className="rounded-card bg-white p-3 shadow-card">
          {person.lastContactAt
            ? `最終接触: ${formatYMD(new Date(person.lastContactAt))}`
            : "接触履歴はまだありません"}
        </div>

        <h2 className="mb-2 mt-5 text-lg font-bold">関連する相談（{records.length}件）</h2>
        {records.length === 0 ? (
          <p className="text-text-secondary">この人物に関連する記録はまだありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {records.map((r) => (
              <div key={r.id} className="rounded-card bg-white p-3 shadow-card">
                {r.content}
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      <Dialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        title="タグを編集"
        footer={
          <>
            <button onClick={() => setTagDialogOpen(false)} className="px-3 py-2 text-text-secondary">
              キャンセル
            </button>
            <button
              onClick={() => {
                updatePersonTags(person.id, draftTags);
                setTagDialogOpen(false);
              }}
              className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white"
            >
              保存
            </button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {presetTags.map((tag) => {
            const selected = draftTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  setDraftTags((prev) =>
                    selected ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  selected ? "bg-brand-green text-white" : "bg-neutral-gray text-text-secondary"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}
