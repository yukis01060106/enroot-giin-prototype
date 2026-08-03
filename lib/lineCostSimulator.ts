/**
 * LINE公式アカウントの従量課金をざっくり試算する。
 * プッシュ・マルチキャスト・ブロードキャスト・ナローキャストは通数カウント対象、
 * 応答メッセージ（reply）は対象外、という公式の課金ルールに基づく（2026年時点の
 * 目安の料金体系。実際の料金・プラン内容は変更され得るためLINE公式サイトで要確認）。
 */
export interface LinePlanTier {
  name: string;
  includedMessages: number;
  monthlyFee: number;
  /** 上限超過分の1通あたりの目安単価（税別）。プランが上限を持たない場合はnull。 */
  overageRate: number | null;
}

export const linePlanTiers: LinePlanTier[] = [
  { name: "コミュニケーションプラン", includedMessages: 200, monthlyFee: 0, overageRate: null },
  { name: "ライトプラン", includedMessages: 5_000, monthlyFee: 5_000, overageRate: null },
  { name: "スタンダードプラン", includedMessages: 30_000, monthlyFee: 15_000, overageRate: 3 },
];

export interface LineCostEstimate {
  monthlyMessages: number;
  plan: LinePlanTier;
  overageMessages: number;
  overageFee: number;
  totalFee: number;
}

/** 月間配信通数から、最も安く収まるプランと概算月額を求める。 */
export function estimateLineCost(monthlyMessages: number): LineCostEstimate {
  const rounded = Math.max(0, Math.round(monthlyMessages));

  for (const plan of linePlanTiers) {
    if (plan.overageRate === null && rounded <= plan.includedMessages) {
      return { monthlyMessages: rounded, plan, overageMessages: 0, overageFee: 0, totalFee: plan.monthlyFee };
    }
  }

  // 最上位（スタンダード）プランで収まるか、それも超えて超過課金になるかの2パターン
  const standard = linePlanTiers[linePlanTiers.length - 1];
  const overageMessages = Math.max(0, rounded - standard.includedMessages);
  const overageFee = overageMessages * (standard.overageRate ?? 0);
  return {
    monthlyMessages: rounded,
    plan: standard,
    overageMessages,
    overageFee,
    totalFee: standard.monthlyFee + overageFee,
  };
}

export interface LineSimulationInput {
  followerCount: number;
  broadcastsPerMonth: number;
  /** ナローキャストで配信対象を絞り込む割合（0〜1）。1なら全員に一斉配信と同じ。 */
  narrowcastRatio: number;
}

export interface LineSimulationResult {
  naive: LineCostEstimate;
  optimized: LineCostEstimate;
  monthlySavings: number;
}

export function simulateLineCost(input: LineSimulationInput): LineSimulationResult {
  const followers = Math.max(0, input.followerCount);
  const broadcasts = Math.max(0, input.broadcastsPerMonth);
  const ratio = Math.min(Math.max(input.narrowcastRatio, 0), 1);

  const naive = estimateLineCost(followers * broadcasts);
  const optimized = estimateLineCost(followers * broadcasts * ratio);

  return {
    naive,
    optimized,
    monthlySavings: naive.totalFee - optimized.totalFee,
  };
}
