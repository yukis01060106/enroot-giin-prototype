"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, TrendingDown, Info } from "lucide-react";
import { simulateLineCost, type LineCostEstimate } from "@/lib/lineCostSimulator";
import { formatYen } from "@/lib/currencyFormat";

function EstimateCard({
  label,
  estimate,
  tone,
}: {
  label: string;
  estimate: LineCostEstimate;
  tone: "neutral" | "good";
}) {
  return (
    <div
      className={`flex-1 rounded-card p-4 shadow-card ${
        tone === "good" ? "bg-brand-green/8 ring-1 ring-brand-green/30" : "bg-white"
      }`}
    >
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{formatYen(estimate.totalFee)}</p>
      <p className="mt-0.5 text-xs text-text-secondary">/月</p>
      <div className="mt-3 flex flex-col gap-1 text-xs text-text-secondary">
        <p className="tabular-nums">配信通数 約{estimate.monthlyMessages.toLocaleString()}通/月</p>
        <p>{estimate.plan.name}</p>
        {estimate.overageMessages > 0 && (
          <p className="text-warning">超過分 約{estimate.overageMessages.toLocaleString()}通（+{formatYen(estimate.overageFee)}）</p>
        )}
      </div>
    </div>
  );
}

export default function LineCostSimulatorPage() {
  const router = useRouter();
  const [followerCount, setFollowerCount] = useState(3000);
  const [broadcastsPerMonth, setBroadcastsPerMonth] = useState(4);
  const [narrowcastPercent, setNarrowcastPercent] = useState(30);

  const result = useMemo(
    () =>
      simulateLineCost({
        followerCount,
        broadcastsPerMonth,
        narrowcastRatio: narrowcastPercent / 100,
      }),
    [followerCount, broadcastsPerMonth, narrowcastPercent]
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/posting")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">LINE公式 料金シミュレーター</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm leading-relaxed text-text-secondary">
          LINE公式アカウントは、プッシュ・一斉配信は通数が課金対象ですが、個別の問い合わせへの
          <span className="font-semibold text-text-primary">「応答（reply）」は通数にカウントされません</span>
          。配信対象を絞り込む（ナローキャスト）ほど、月々のLINE利用料を抑えられます。
        </p>

        <div className="mt-5 rounded-card bg-white p-4 shadow-card">
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 flex justify-between text-sm font-semibold">
                <span>フォロワー数</span>
                <span className="tabular-nums text-primary-blue">{followerCount.toLocaleString()}人</span>
              </span>
              <input
                type="range"
                min={0}
                max={20000}
                step={100}
                value={followerCount}
                onChange={(e) => setFollowerCount(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
            </label>

            <label className="block">
              <span className="mb-1 flex justify-between text-sm font-semibold">
                <span>月間の配信回数</span>
                <span className="tabular-nums text-primary-blue">{broadcastsPerMonth}回/月</span>
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={broadcastsPerMonth}
                onChange={(e) => setBroadcastsPerMonth(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
            </label>

            <label className="block">
              <span className="mb-1 flex justify-between text-sm font-semibold">
                <span>ナローキャストで絞り込む割合</span>
                <span className="tabular-nums text-primary-blue">{narrowcastPercent}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={narrowcastPercent}
                onChange={(e) => setNarrowcastPercent(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
              <span className="mt-1 block text-xs text-text-secondary">
                例: 地域別・関心テーマ別に配信先を絞る想定。100%は全員に一斉配信するのと同じです。
              </span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <EstimateCard label="全員に一斉配信した場合" estimate={result.naive} tone="neutral" />
          <EstimateCard label="ナローキャストで最適化した場合" estimate={result.optimized} tone="good" />
        </div>

        {result.monthlySavings > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-card bg-brand-green p-4 text-white shadow-raised">
            <TrendingDown size={28} className="shrink-0" />
            <div>
              <p className="text-sm text-white/80">配信を最適化した場合の削減額</p>
              <p className="text-xl font-bold tabular-nums">月あたり {formatYen(result.monthlySavings)} の削減</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-input bg-neutral-gray p-3 text-xs leading-relaxed text-text-secondary">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            料金体系はLINE公式アカウントの目安（コミュニケーションプラン ¥0/200通、ライト ¥5,000/5,000通、
            スタンダード ¥15,000/30,000通、超過は目安¥3/通）に基づく概算です。実際の料金・プラン内容は
            LINE公式サイトで最新の情報をご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}
