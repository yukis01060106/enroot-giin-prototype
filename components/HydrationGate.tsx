"use client";

import { useStoreHydrated } from "@/store/appStore";

/**
 * このアプリは完全にクライアント側のモックデータ（Zustandストア）だけで動く
 * "use client" SPA。ストアのseedData()は生成された瞬間の new Date() を基準に
 * 「今日の予定」等の相対的な日付を計算するため、next buildのサーバープリレンダー
 * （ビルド時刻）とクライアントのハイドレーション（実際にページを開いた時刻）とで
 * 計算結果が食い違い、Reactのハイドレーションエラー（#418・#185系）を引き起こす。
 *
 * ルートレイアウトでchildren全体をこれで包み、クライアント側のリハイドレーションが
 * 完了するまで何も描画しないことで、サーバー側の（古い/ズレた）プリレンダー結果と
 * 実際のクライアント初回描画を絶対に比較させない（＝ミスマッチが原理的に起こらない）。
 * このアプリにSEOやノーJS対応は不要なので、初回の空白は許容できるトレードオフ。
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useStoreHydrated();
  if (!hydrated) return null;
  return <>{children}</>;
}
