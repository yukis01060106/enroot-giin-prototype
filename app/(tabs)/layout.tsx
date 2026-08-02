"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useAppStore } from "@/store/appStore";

/**
 * 4タブ（秘書/ホーム/議会準備/設定）共通のシェル。
 * Flutter版main.dartの初回起動リダイレクトロジック（SharedPreferencesの
 * onboarding_complete判定）をクライアント側で再現する。
 * output:'export'はmiddlewareが使えないため、ここでしか判定できない。
 * ハイドレーション完了の待ち合わせはルートレイアウトのHydrationGateが
 * 一括で担うため、ここでは常に完了済みの前提でよい。
 */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const hasOpenedHome = useAppStore((s) => s.hasOpenedHome);
  const markHomeOpened = useAppStore((s) => s.markHomeOpened);

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    // 初回起動時のみ秘書タブ、2回目以降はホームタブを初期表示（Flutter版と同じ）。
    if (pathname === "/" && !hasOpenedHome) {
      router.replace("/secretary");
    }
  }, [onboardingComplete, hasOpenedHome, pathname, router]);

  useEffect(() => {
    if (pathname === "/" && onboardingComplete) {
      markHomeOpened();
    }
  }, [pathname, onboardingComplete, markHomeOpened]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
