import { planLimits, type PlanTier } from "@/store/appStore";

/**
 * プラン一覧の単一ソース。設定＞プラン変更画面と請求書生成画面の両方から
 * 参照する（priceValueは税抜の月額円、請求書の税計算に使う）。
 */
export interface PlanCatalogEntry {
  tier: PlanTier;
  name: string;
  /** 税抜の月額（円）。すべてのプランは税別表記。 */
  priceValue: number;
  price: string;
  features: string[];
}

export const planCatalog: PlanCatalogEntry[] = [
  {
    tier: "free",
    name: "フリー",
    priceValue: 0,
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
    priceValue: 980,
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
    priceValue: 2980,
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
    priceValue: 6980,
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
    priceValue: 9800,
    price: "¥9,800 / 月",
    features: [`記録 月${planLimits.voice.records}件まで`, "プレミアムの全機能", "音声ブリーフィング・音声対話"],
  },
];
