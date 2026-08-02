"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useAppStore, planLimits, type PlanTier } from "@/store/appStore";
import { showToast } from "@/lib/notReady";

const plans: {
  tier: PlanTier;
  name: string;
  price: string;
  features: string[];
}[] = [
  {
    tier: "free",
    name: "フリー",
    price: "¥0 / 月",
    features: [`記録 月${planLimits.free.records}件まで`, `名刺管理 ${planLimits.free.persons}件まで`, "AI秘書チャット", "SNS発信下書き作成"],
  },
  {
    tier: "pro",
    name: "プロ",
    price: "¥980 / 月",
    features: [
      `記録 月${planLimits.pro.records}件まで`,
      `名刺管理 ${planLimits.pro.persons}件まで`,
      "AI秘書チャット",
      "SNS発信下書き作成",
      "視察報告書・収支報告書のPDF出力",
      "活用レポート（月次サマリー）",
    ],
  },
];

export default function PlanPage() {
  const router = useRouter();
  const planTier = useAppStore((s) => s.planTier);
  const setPlanTier = useAppStore((s) => s.setPlanTier);

  function selectPlan(tier: PlanTier) {
    if (tier === planTier) return;
    setPlanTier(tier);
    showToast(`${tier === "pro" ? "プロ" : "フリー"}プランに変更しました（デモ環境のため実際の課金は発生しません）`);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">プランを変更する</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {plans.map((p) => {
            const selected = p.tier === planTier;
            return (
              <div
                key={p.tier}
                className={`rounded-card border-2 bg-white p-4 shadow-card ${
                  selected ? "border-brand-green" : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">{p.name}</p>
                  {selected && (
                    <span className="rounded-chip bg-brand-green/12 px-2.5 py-1 text-xs font-bold text-brand-green">
                      現在のプラン
                    </span>
                  )}
                </div>
                <p className="mt-1 text-2xl font-bold">{p.price}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => selectPlan(p.tier)}
                  disabled={selected}
                  className="mt-4 h-tap-target w-full rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
                >
                  {selected ? "選択中" : `${p.name}プランにする`}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-text-secondary">
          プロトタイプのデモ環境のため、実際の決済は発生しません。
        </p>
      </div>
    </div>
  );
}
