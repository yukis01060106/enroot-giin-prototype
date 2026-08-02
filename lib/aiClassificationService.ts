import type { RecordCategory } from "@/types/models";

/**
 * AI自動分類サービス（プロトタイプ用モック）。ai_classification_service.dart の移植。
 * キーワードベースのヒューリスティック。本番ではClaude API経由に置き換える。
 */
const keywordMap: Record<RecordCategory, string[]> = {
  consultation: ["相談", "要望", "陳情", "困って", "直して", "直して欲しい"],
  person: ["さんから", "さんと", "会長", "部長", "役員", "町内会", "商工会", "PTA"],
  question: ["一般質問", "質問で取り上げ", "政策", "議会で"],
  expense: ["領収書", "経費", "支出", "購入した"],
  todo: ["連絡する", "確認する", "提出する", "作成する", "しなければ", "やらないと"],
  schedule: ["明日", "来週", "今度の", "時に", "会議", "懇談会", "本会議"],
};

export function classify(content: string): { categories: RecordCategory[]; confidence: number } {
  const matched: RecordCategory[] = [];
  for (const [category, keywords] of Object.entries(keywordMap) as [RecordCategory, string[]][]) {
    if (keywords.some((kw) => content.includes(kw))) matched.push(category);
  }
  if (matched.length === 0) return { categories: ["consultation"], confidence: 0.4 };
  return { categories: matched, confidence: 0.75 };
}
