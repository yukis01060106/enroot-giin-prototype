"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import { formatYMD } from "@/lib/formatDate";

/**
 * このプロトタイプには実際の認証基盤がないため「今のパスワードと照合する」ことは
 * できないが、フォーム自体のバリデーション（未入力チェック・文字数・確認一致）は
 * 本物として実装し、最終更新日時をプロフィールに記録する（表示専用のフィールド）。
 */
export default function PasswordPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function save() {
    if (!current.trim()) {
      setError("現在のパスワードを入力してください");
      return;
    }
    if (next.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (next !== confirm) {
      setError("新しいパスワード（確認）が一致しません");
      return;
    }
    setError("");
    updateProfile((p) => ({ ...p, passwordChangedAt: new Date().toISOString() }));
    showToast("パスワードを変更しました");
    router.push("/settings");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">パスワード変更</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {profile.passwordChangedAt && (
          <p className="mb-4 text-sm text-text-secondary">
            最終更新: {formatYMD(new Date(profile.passwordChangedAt))}
          </p>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-semibold">現在のパスワード</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold">新しいパスワード</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="8文字以上"
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold">新しいパスワード（確認）</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          {error && <p className="text-sm font-semibold text-error">{error}</p>}
          <button onClick={save} className="h-tap-target rounded-input bg-brand-green font-bold text-white">
            変更する
          </button>
        </div>
      </div>
    </div>
  );
}
