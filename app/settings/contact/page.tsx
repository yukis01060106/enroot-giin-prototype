"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";

const categories = ["不具合の報告", "機能のご要望", "使い方について", "その他"];

export default function ContactPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    showToast("お問い合わせを送信しました。ご返信までしばらくお待ちください。");
    router.push("/settings");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">お問い合わせ</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-semibold">お名前</label>
            <input
              value={profile.displayName}
              readOnly
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-neutral-gray px-3 text-text-secondary"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-semibold">お問い合わせ内容</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="内容をご記入ください"
              className="w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <button
            onClick={send}
            disabled={sending || !message.trim()}
            className="flex h-tap-target items-center justify-center rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
          >
            {sending ? <Loader2 size={20} className="animate-spin" /> : "送信する"}
          </button>
        </div>
      </div>
    </div>
  );
}
