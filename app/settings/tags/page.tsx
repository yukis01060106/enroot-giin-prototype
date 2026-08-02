"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, X, Plus } from "lucide-react";
import { useAppStore } from "@/store/appStore";

/** 名刺管理のタグ候補を追加・削除する設定画面。 */
export default function TagSettingsPage() {
  const router = useRouter();
  const tags = useAppStore((s) => s.presetPersonTags);
  const addTag = useAppStore((s) => s.addPresetPersonTag);
  const removeTag = useAppStore((s) => s.removePresetPersonTag);
  const [input, setInput] = useState("");

  function submit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    addTag(trimmed);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/contacts")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">名刺管理のタグ設定</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-text-secondary">
          ここで追加・削除したタグが、名刺の詳細画面「タグを編集」の候補に出てきます。
        </p>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="新しいタグ名"
            className="h-tap-target flex-1 rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            aria-label="追加"
            className="flex h-tap-target w-tap-target items-center justify-center rounded-input bg-brand-green text-white disabled:opacity-40"
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-text-secondary">タグはまだありません</p>
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 rounded-chip bg-brand-green/10 py-1.5 pl-3 pr-2 text-sm font-semibold text-brand-green"
              >
                {tag}
                <button onClick={() => removeTag(tag)} aria-label={`${tag}を削除`} className="rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
