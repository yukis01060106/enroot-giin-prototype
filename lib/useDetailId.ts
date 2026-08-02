"use client";

import { useSearchParams } from "next/navigation";

/**
 * クエリ文字列（?id=xxx）ベースのmaster-detail用フック。
 *
 * Flutterの実行時UUIDに紐づく画面（名刺詳細・テンプレート編集 等）は、
 * output:'export' の generateStaticParams が要求する「ビルド時に全パターンを
 * 列挙する」ことができない（値がSupabase/モックデータ側でランタイムに決まるため）。
 * そのため [id] 動的ルートではなく、クエリ文字列で詳細対象を指定する。
 *
 * このフックを呼ぶコンポーネントは、呼び出し元のページで <SuspenseBoundary> を
 * 経由すること（useSearchParams はNext.jsのCSR bailout要件によりSuspense境界が必要）。
 */
export function useDetailId(paramName: string = "id"): string | null {
  const searchParams = useSearchParams();
  return searchParams.get(paramName);
}
