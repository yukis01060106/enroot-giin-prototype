/**
 * images.unoptimized:true では next/image が basePath を自動付与しないため
 * （最適化サーバーを経由しない静的書き出し特有の制約）、/public 配下の画像を
 * 参照する箇所ではこれを通す。通常ビルドでは NEXT_PUBLIC_BASE_PATH が空文字なので
 * 影響しない。
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${basePath}${path}`;
}
