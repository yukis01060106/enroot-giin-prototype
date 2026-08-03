/**
 * 発信タブ用のAI機能（ハッシュタグ提案）。posting_ai_service.dart の移植。
 * キーワードベースのモック。本番ではClaude API経由の生成に置き換える。
 *
 * 旧「炎上リスクチェック」（キーワード一致でAIが安全/注意を自動判定する機能）は
 * 撤去した。AIが「問題なし」と判定した投稿が実際に炎上した場合の説明責任が
 * 生じ得ることに加え、簡易なキーワード一致では実際のリスクを見抜けないため
 * 誤った安心感を与えかねない。人間が確認する「投稿前チェックリスト」
 * （app/posting/edit/page.tsx）に置き換えている。
 */
const hashtagRules: Record<string, string[]> = {
  相談: ["#住民相談", "#地域の声"],
  道路: ["#道路整備", "#暮らしの安全"],
  子育て: ["#子育て支援", "#教育"],
  一般質問: ["#市議会", "#一般質問"],
  商工: ["#地域経済", "#商工会"],
  懇談: ["#地域交流"],
};

export function suggestHashtags(content: string): string[] {
  const tags = new Set<string>(["#大牟田市", "#市政"]);
  for (const [keyword, values] of Object.entries(hashtagRules)) {
    if (content.includes(keyword)) for (const v of values) tags.add(v);
  }
  return [...tags];
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
