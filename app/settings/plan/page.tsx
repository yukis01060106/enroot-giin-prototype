"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Users, Vote } from "lucide-react";
import { useAppStore, planLimits, planTierLabels, type PlanTier } from "@/store/appStore";
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
    features: [
      `記録 月${planLimits.free.records}件まで`,
      `名刺管理 ${planLimits.free.persons}件まで`,
      "AI秘書チャット",
      "SNS発信下書き作成",
    ],
  },
  {
    tier: "light",
    name: "ライト",
    price: "¥980 / 月",
    features: [
      `記録 月${planLimits.light.records}件まで`,
      `名刺管理 ${planLimits.light.persons}件まで`,
      "名刺・レシートのOCR自動読み取り",
      "議会準備（一般質問）",
      "LINE公式の下書き作成",
    ],
  },
  {
    tier: "standard",
    name: "スタンダード",
    price: "¥2,980 / 月",
    features: [
      `記録 月${planLimits.standard.records}件まで`,
      "名刺管理 無制限",
      "議会準備（一般質問・視察報告・政活費報告・住民相談管理）",
      "経費の按分設定・自治体費目プリセット",
      "LINE公式 配信最適化シミュレーター",
      "活用レポート（月次サマリー）",
    ],
  },
  {
    tier: "premium",
    name: "プレミアム",
    price: "¥6,980 / 月",
    features: [
      `記録 月${planLimits.premium.records}件まで`,
      "スタンダードの全機能",
      "議会準備の深掘り機能",
      "LINE公式 AI一次応答（reply、通数無課金）",
    ],
  },
  {
    tier: "voice",
    name: "ボイス",
    price: "¥9,800 / 月",
    features: [`記録 月${planLimits.voice.records}件まで`, "プレミアムの全機能", "音声ブリーフィング・音声対話"],
  },
];

export default function PlanPage() {
  const router = useRouter();
  const planTier = useAppStore((s) => s.planTier);
  const setPlanTier = useAppStore((s) => s.setPlanTier);

  function selectPlan(tier: PlanTier) {
    if (tier === planTier) return;
    setPlanTier(tier);
    showToast(`${planTierLabels[tier]}プランに変更しました（デモ環境のため実際の課金は発生しません）`);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/settings")} aria-label="戻る" className="rounded-full p-2">
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

        <div className="mt-5 rounded-card border border-neutral-gray bg-white p-4">
          <div className="flex items-center gap-2 font-bold">
            <Users size={18} className="text-primary-blue" />
            会派プラン（5人以上・年額のみ）
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            プレミアムの全機能に加え、共有ダッシュボード・共有テンプレート・会派内チャットが使えます。お申し込みはお問い合わせからご相談ください。
          </p>
        </div>

        <div className="mt-3 rounded-card border border-neutral-gray bg-white p-4">
          <div className="flex items-center gap-2 font-bold">
            <Vote size={18} className="text-accent-rose" />
            選挙・後援会モード（別サブスクリプション）
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            選挙事務の日程管理・法定文書チェックリスト・ボランティア管理等は、政務活動費の按分対象外にするため、このプランとは別の請求として提供します（本体プランには含まれません）。
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-text-secondary">
          プロトタイプのデモ環境のため、実際の決済は発生しません。
        </p>
      </div>
    </div>
  );
}
