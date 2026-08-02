import type { NextConfig } from "next";

// GitHub Pagesはプロジェクトページの場合 /<repo名>/ 配下での配信になるため、
// DEPLOY_TARGET=gh-pages のビルド時のみ basePath/assetPrefix を付与する
// （通常のローカル開発・本番ビルドには影響させない）。
const isGhPages = process.env.DEPLOY_TARGET === "gh-pages";
const ghPagesRepoName = "enroot-giin-prototype";

const nextConfig: NextConfig = {
  // 静的エクスポート（SSG）。サーバーランタイムを持たないため、秘密鍵を扱う処理は
  // すべて外部（Supabase Edge Function）に置く。詳細は移行計画のPhase 0参照。
  output: "export",
  images: {
    unoptimized: true,
  },
  ...(isGhPages && {
    basePath: `/${ghPagesRepoName}`,
    assetPrefix: `/${ghPagesRepoName}/`,
  }),
};

export default nextConfig;
