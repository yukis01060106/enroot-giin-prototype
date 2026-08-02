"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "第1条（適用）",
    body: "本規約は、En Root ─ 議員エディション（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意の上、本サービスを利用するものとします。",
  },
  {
    title: "第2条（利用登録・データの取り扱い）",
    body: "本サービスに記録された活動記録・名刺情報・経費データ等は、利用者本人の端末内、または利用者が同意した範囲でのみ保存・利用されます。",
  },
  {
    title: "第3条（AI機能について）",
    body: "本サービスのAI秘書機能・下書き生成機能等は、生成AIを用いた支援機能です。生成される内容の正確性を保証するものではなく、最終的な内容の確認・判断は利用者の責任で行うものとします。",
  },
  {
    title: "第4条（禁止事項）",
    body: "利用者は、法令または公序良俗に違反する行為、本サービスの運営を妨害する行為を行ってはならないものとします。",
  },
  {
    title: "第5条（免責事項）",
    body: "本サービスは現状有姿で提供され、その完全性・正確性・有用性等について明示的にも黙示的にも保証しません。",
  },
];

export default function LegalPage() {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">利用規約 / プライバシーポリシー</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-card border border-warning/40 bg-warning/10 p-3 text-sm text-text-primary">
          これはプロトタイプ用のサンプル文面です。実際のサービス提供にあたっては、法務確認済みの正式な利用規約・プライバシーポリシーに差し替えてください。
        </div>
        <div className="flex flex-col gap-5">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-1.5 font-bold">{s.title}</h2>
              <p className="leading-relaxed text-text-primary">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
