import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的エクスポート（SSG）。サーバーランタイムを持たないため、秘密鍵を扱う処理は
  // すべて外部（Supabase Edge Function）に置く。詳細は移行計画のPhase 0参照。
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
