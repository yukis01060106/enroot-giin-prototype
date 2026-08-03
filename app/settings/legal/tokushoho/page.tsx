"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const rows: { label: string; value: string }[] = [
  { label: "販売事業者", value: "（事業者名を記載）" },
  { label: "運営責任者", value: "（責任者名を記載）" },
  { label: "所在地", value: "（請求があれば遅滞なく開示します）" },
  { label: "電話番号", value: "（請求があれば遅滞なく開示します）" },
  { label: "メールアドレス", value: "（お問い合わせフォームに記載のアドレス）" },
  { label: "販売価格", value: "各プランの料金は「プランを変更する」画面に記載の月額（税別）です。" },
  { label: "商品代金以外の必要料金", value: "特にありません（通信費はお客様のご負担となります）。" },
  { label: "お支払い方法", value: "クレジットカード決済（Stripe）" },
  { label: "お支払い時期", value: "初回はお申し込み時、以降は毎月同日に自動課金されます。" },
  { label: "サービス提供時期", value: "お支払い手続き完了後、直ちにご利用いただけます。" },
  {
    label: "返品・キャンセルについて",
    value:
      "デジタルサービスの性質上、提供開始後の返金には対応しておりません。次回更新の停止（解約）はいつでも「設定＞プランを変更する」から行えます。",
  },
  {
    label: "自動更新について",
    value: "各プランは自動更新です。次回更新日の前日までに解約手続きを行わない場合、同一条件で自動的に更新されます。",
  },
  { label: "解約方法・解約期限", value: "「設定＞プランを変更する」からいつでも解約でき、次回更新日の前日23:59まで手続き可能です。" },
];

export default function TokushohoPage() {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">特定商取引法に基づく表記</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-card border border-warning/40 bg-warning/10 p-3 text-sm leading-relaxed text-text-primary">
          これはプロトタイプ用の雛形です。実際のサービス提供にあたっては、事業者名・所在地・連絡先等の実在の情報に差し替え、法務確認を受けた上で公開してください。
        </div>
        <div className="flex flex-col divide-y divide-neutral-gray rounded-card bg-white shadow-card">
          {rows.map((r) => (
            <div key={r.label} className="p-3.5">
              <p className="text-sm font-bold text-text-secondary">{r.label}</p>
              <p className="mt-1 leading-relaxed">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
