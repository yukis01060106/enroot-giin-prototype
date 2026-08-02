import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ToastHost } from "@/components/ToastHost";
import "./globals.css";

/*
 * Flutter版で一度FOUT（読み込み中に文字化けが一瞬見える）バグを踏んで修正した
 * 経緯があるため、確実にセルフホストされるnext/font/localを最初から採用する。
 * サブセット済み（日本語実用範囲＋ラテン文字。CJK統合漢字を含めても元の5.7MBから
 * 4.5MBまで削減済み）のファイルをそのまま流用し、再サブセット化はしない。
 */
const notoSansJP = localFont({
  src: [
    { path: "./fonts/NotoSansJP-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/NotoSansJP-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "En Root ─ 議員エディション",
  description: "地方議員のための活動管理・AI秘書アプリ",
};

export const viewport: Viewport = {
  themeColor: "#1565c0",
  width: "device-width",
  initialScale: 1,
};

/**
 * 画面幅が480pxを超える場合（タブレット横向き・デスクトップブラウザ等）は
 * コンテンツを中央揃え・幅制限してレターボックス表示する。スマートフォン実機では
 * 閾値を下回るため素通しで表示される。Flutter版のResponsiveFrameと同じ挙動を
 * MediaQuery相当のJSを使わず純粋なCSSで実現する。
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="font-sans antialiased bg-primary-blue">
        <div className="mx-auto min-h-screen w-full max-w-[480px] overflow-hidden bg-scaffold-bg text-text-primary">
          {children}
        </div>
        <ToastHost />
      </body>
    </html>
  );
}
