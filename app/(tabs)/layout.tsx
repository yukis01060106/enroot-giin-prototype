"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useAppStore, useStoreHydrated } from "@/store/appStore";

/**
 * 4タブ（秘書/ホーム/議会準備/設定）共通のシェル。
 * Flutter版main.dartの初回起動リダイレクトロジック（SharedPreferencesの
 * onboarding_complete判定）をクライアント側で再現する。
 * output:'export'はmiddlewareが使えないため、ここでしか判定できない。
 */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStoreHydrated();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const hasOpenedHome = useAppStore((s) => s.hasOpenedHome);
  const markHomeOpened = useAppStore((s) => s.markHomeOpened);

  useEffect(() => {
    if (!hydrated) return;
    if (!onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    // 初回起動時のみ秘書タブ、2回目以降はホームタブを初期表示（Flutter版と同じ）。
    if (pathname === "/" && !hasOpenedHome) {
      router.replace("/secretary");
    }
  }, [hydrated, onboardingComplete, hasOpenedHome, pathname, router]);

  useEffect(() => {
    if (pathname === "/" && hydrated && onboardingComplete) {
      markHomeOpened();
    }
  }, [pathname, hydrated, onboardingComplete, markHomeOpened]);

  if (!hydrated) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
