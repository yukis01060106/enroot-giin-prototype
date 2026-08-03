"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Users, Vote, ChevronRight, FileText } from "lucide-react";
import { useAppStore, planTierLabels, type PlanTier } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import { Dialog } from "@/components/ui/Dialog";
import { planCatalog as plans } from "@/lib/planCatalog";

export default function PlanPage() {
  const router = useRouter();
  const planTier = useAppStore((s) => s.planTier);
  const setPlanTier = useAppStore((s) => s.setPlanTier);
  // 特定商取引法は、有料契約の申し込み確定の直前に対価・支払時期・自動更新の
  // 有無・解約方法・解約期限を表示することを求めている。無料プランへの変更は
  // 商取引ではないため、この確認なしで即時に切り替える。
  const [pendingTier, setPendingTier] = useState<PlanTier | null>(null);
  const [agreed, setAgreed] = useState(false);
  const pendingPlan = plans.find((p) => p.tier === pendingTier);

  function selectPlan(tier: PlanTier) {
    if (tier === planTier) return;
    if (tier === "free") {
      setPlanTier(tier);
      showToast("フリープランに変更しました（デモ環境のため実際の課金は発生しません）");
      return;
    }
    setAgreed(false);
    setPendingTier(tier);
  }

  function confirmSubscribe() {
    if (!pendingTier || !agreed) return;
    setPlanTier(pendingTier);
    showToast(`${planTierLabels[pendingTier]}プランに変更しました（デモ環境のため実際の課金は発生しません）`);
    setPendingTier(null);
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

        {planTier !== "free" && (
          <button
            onClick={() => router.push("/settings/plan/invoice")}
            className="mt-3 flex w-full items-center justify-between rounded-card bg-white p-4 shadow-card"
          >
            <span className="flex items-center gap-2 font-bold">
              <FileText size={18} className="text-primary-blue" />
              請求書を発行する
            </span>
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        )}

        <p className="mt-4 text-center text-xs text-text-secondary">
          プロトタイプのデモ環境のため、実際の決済は発生しません。
        </p>
      </div>

      <Dialog
        open={!!pendingPlan}
        onOpenChange={(o) => !o && setPendingTier(null)}
        title="お申し込み内容のご確認"
        footer={
          <>
            <button onClick={() => setPendingTier(null)} className="px-3 py-2 text-text-secondary">
              キャンセル
            </button>
            <button
              onClick={confirmSubscribe}
              disabled={!agreed}
              className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white disabled:opacity-40"
            >
              同意して申し込む
            </button>
          </>
        }
      >
        {pendingPlan && (
          <>
            <div className="rounded-input bg-neutral-gray p-3">
              <p className="text-lg font-bold">{pendingPlan.name}プラン</p>
              <p className="text-2xl font-bold">{pendingPlan.price}</p>
            </div>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div>
                <dt className="font-bold text-text-secondary">お支払い時期</dt>
                <dd>初回は今すぐ、以降は毎月同日に自動的に課金されます。</dd>
              </div>
              <div>
                <dt className="font-bold text-text-secondary">自動更新の有無</dt>
                <dd>自動更新です。次回更新日の前日までに解約手続きを行わない場合、同一条件で自動的に更新されます。</dd>
              </div>
              <div>
                <dt className="font-bold text-text-secondary">解約方法・解約期限</dt>
                <dd>この「プランを変更する」画面からいつでも解約できます。次回更新日の前日23:59まで手続き可能です。</dd>
              </div>
            </dl>
            <button
              onClick={() => router.push("/settings/legal/tokushoho")}
              className="flex items-center justify-between rounded-input border border-neutral-gray px-3 py-2.5 text-sm font-semibold text-primary-blue"
            >
              特定商取引法に基づく表記を確認する
              <ChevronRight size={16} />
            </button>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              上記の支払条件・解約条件を確認し、同意します
            </label>
          </>
        )}
      </Dialog>
    </div>
  );
}
