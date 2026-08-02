"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

/**
 * スタブ。本実装（美咲との会話形式オンボーディング）はPhase 6。
 * ここでは初回起動リダイレクトの導線（Phase 1）だけを成立させる。
 */
export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-text-secondary">オンボーディング本実装はPhase 6です。</p>
      <button
        className="h-tap-target rounded-input bg-brand-green px-6 font-bold text-white"
        onClick={() => {
          completeOnboarding();
          router.replace("/");
        }}
      >
        はじめる（仮）
      </button>
    </main>
  );
}
