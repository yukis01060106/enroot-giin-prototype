"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

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

const privacySections = [
  {
    title: "1. 取得する情報",
    body: "活動記録・名刺情報・経費データ・カレンダーの予定・AI秘書チャットへの入力内容など、利用者が本サービスに入力した情報を取得します。",
  },
  {
    title: "2. 利用目的",
    body: "取得した情報は、記録の分類・整理、下書きの生成、活動管理機能の提供など、本サービスの機能を提供する目的でのみ利用します。",
  },
  {
    title: "3. 外国にある第三者への提供（AI機能について）",
    body: "AI秘書チャット・レシート/名刺のOCR・読み上げ音声等の機能では、入力内容の一部が米国のAnthropic PBC・Google LLCのサーバーに送信され処理されます。これらの事業者とは、個人情報保護法に基づく体制整備（業務委託）を行った上で提供することを原則とし、必要な範囲で利用者の同意を得ます。各社は送信された内容をAIモデルの学習に利用しない方針のプランを前提としています。",
  },
  {
    title: "4. 要配慮個人情報の取扱い",
    body: "住民相談等の記録に、健康状態・病歴・障害・犯罪歴等の要配慮個人情報が含まれる場合は、記録作成画面での本人同意の確認をもって取得・AI処理を行います。同意が確認できない内容の入力は控えてください。",
  },
  {
    title: "5. 開示・訂正・削除",
    body: "設定画面の「データエクスポート」から保存データを取得、「アカウント削除」からすべてのデータを削除できます。",
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
        <h2 className="mb-3 text-lg font-bold">利用規約</h2>
        <div className="flex flex-col gap-5">
          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-1.5 font-bold">{s.title}</h3>
              <p className="leading-relaxed text-text-primary">{s.body}</p>
            </section>
          ))}
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold">プライバシーポリシー</h2>
        <div className="flex flex-col gap-5">
          {privacySections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-1.5 font-bold">{s.title}</h3>
              <p className="leading-relaxed text-text-primary">{s.body}</p>
            </section>
          ))}
        </div>

        <button
          onClick={() => router.push("/settings/legal/tokushoho")}
          className="mt-5 flex w-full items-center justify-between rounded-card bg-white p-4 shadow-card"
        >
          <span className="font-bold">特定商取引法に基づく表記</span>
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
