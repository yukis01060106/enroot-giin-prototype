import { Suspense } from "react";

/**
 * useSearchParams()（useDetailId経由含む）を使うページ全てをこれで包む規約。
 * Next.js App RouterはuseSearchParamsを呼ぶクライアントコンポーネントを
 * Suspense境界なしで静的書き出しするとビルド時に警告/エラーになる。
 */
export function SuspenseBoundary({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
