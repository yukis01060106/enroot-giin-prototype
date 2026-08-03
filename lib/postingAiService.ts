/**
 * 発信タブ用のAI機能（ハッシュタグ提案・炎上リスクチェック）。posting_ai_service.dart の移植。
 * キーワードベースのモック。本番ではClaude API経由の生成・分析に置き換える。
 */
export type RiskLevel = "low" | "medium" | "high";

export interface RiskAssessment {
  level: RiskLevel;
  reasons: string[];
}

export const riskLabels: Record<RiskLevel, string> = { low: "低", medium: "中", high: "高" };

const hashtagRules: Record<string, string[]> = {
  相談: ["#住民相談", "#地域の声"],
  道路: ["#道路整備", "#暮らしの安全"],
  子育て: ["#子育て支援", "#教育"],
  一般質問: ["#市議会", "#一般質問"],
  商工: ["#地域経済", "#商工会"],
  懇談: ["#地域交流"],
};

const riskKeywords: Record<string, string[]> = {
  "批判・対立を煽る可能性のある表現": ["対立", "批判する", "許せない", "最悪", "無能"],
  "公職選挙法に抵触しうる表現（投票依頼等）": ["清き一票", "投票してください", "に投票を", "当選させて"],
  "断定的・扇動的な表現": ["絶対に", "全員", "〜すべきだ！", "許さない"],
};

export function suggestHashtags(content: string): string[] {
  const tags = new Set<string>(["#大牟田市", "#市政"]);
  for (const [keyword, values] of Object.entries(hashtagRules)) {
    if (content.includes(keyword)) for (const v of values) tags.add(v);
  }
  return [...tags];
}

export function assessRisk(content: string): RiskAssessment {
  const reasons: string[] = [];
  for (const [reason, keywords] of Object.entries(riskKeywords)) {
    if (keywords.some((kw) => content.includes(kw))) reasons.push(reason);
  }
  if (reasons.length === 0) return { level: "low", reasons: [] };
  if (reasons.length === 1) return { level: "medium", reasons };
  return { level: "high", reasons };
}

/**
 * 「美咲と一緒に作る」フロー用の下書き生成モック。
 * 本番ではClaude APIに元テキスト（メモ本文 or 対話内容）を渡して生成する想定だが、
 * 現段階ではテンプレートに当てはめるだけのモック。
 *
 * Facebook（フォーマルな活動報告）とLINE公式（登録者への親しみやすい一言）は
 * 読み手も使われ方も違うため、同じ文面を使い回すのではなく、同じ元ネタから
 * トーンの異なる2種類を生成する。
 */
export interface PlatformDrafts {
  facebook: string;
  line: string;
}

export function generateDraftFromMemo(memoContent: string): PlatformDrafts {
  const trimmed = memoContent.trim();
  return {
    facebook:
      `【活動報告】\n${trimmed}\n\n` +
      "今後も現場の声を大切に、市政に取り組んでまいります。引き続きよろしくお願いいたします。",
    line: `みなさん、こんにちは😊\n\n${trimmed}\n\n` + "これからもみなさんの声を聞きながら頑張ります！",
  };
}

export function generateDraftFromDialogue(topic: string, detail: string): PlatformDrafts {
  const trimmed = topic.trim();
  const detailPart = detail.trim();
  return {
    facebook:
      `【活動報告】\n本日は${trimmed}について活動してまいりました。\n` +
      (detailPart ? `${detailPart}\n\n` : "\n") +
      "皆さまからのお声を今後の活動にしっかり活かしてまいります。引き続きよろしくお願いいたします。",
    line:
      `こんにちは😊\n\n今日は${trimmed}に行ってきました！\n` +
      (detailPart ? `${detailPart}\n\n` : "\n") +
      "またご報告しますね！",
  };
}
