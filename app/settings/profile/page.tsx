"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, MinusCircle, PlusCircle } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";

export default function ProfileEditPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(profile.displayName);
  const [council, setCouncil] = useState(profile.councilName);
  const [termYears, setTermYears] = useState(profile.termYears);
  const [electionDay, setElectionDay] = useState(profile.electionDay ?? "");

  const canSave = name.trim() !== "" && council.trim() !== "";

  function save() {
    updateProfile((p) => ({
      ...p,
      displayName: name.trim(),
      councilName: council.trim(),
      termYears,
      electionDay: electionDay || undefined,
    }));
    router.push("/settings");
    showToast("プロフィールを更新しました");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">プロフィール編集</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 font-bold">名前</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
        />

        <p className="mb-2 mt-4 font-bold">議会名</p>
        <input
          value={council}
          onChange={(e) => setCouncil(e.target.value)}
          className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
        />

        <p className="mb-2 mt-4 font-bold">議員歴</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTermYears((y) => Math.max(0, y - 1))}
            disabled={termYears <= 0}
            aria-label="減らす"
            className="text-primary-blue disabled:opacity-30"
          >
            <MinusCircle size={28} />
          </button>
          <span>{termYears}年目</span>
          <button onClick={() => setTermYears((y) => y + 1)} aria-label="増やす" className="text-primary-blue">
            <PlusCircle size={28} />
          </button>
        </div>

        <p className="mb-1 mt-4 font-bold">投票日（任意）</p>
        <p className="mb-2 text-sm text-text-secondary">
          設定すると、当日はSNS投稿をブロックします（公職選挙法は投票日当日の選挙運動を禁止しています）
        </p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={electionDay}
            onChange={(e) => setElectionDay(e.target.value)}
            className="h-tap-target flex-1 rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
          />
          {electionDay && (
            <button
              onClick={() => setElectionDay("")}
              className="h-tap-target shrink-0 rounded-input border border-neutral-gray px-3 text-sm text-text-secondary"
            >
              クリア
            </button>
          )}
        </div>

        <button
          onClick={save}
          disabled={!canSave}
          className="mt-6 h-tap-target w-full rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
        >
          保存する
        </button>
      </div>
    </div>
  );
}
