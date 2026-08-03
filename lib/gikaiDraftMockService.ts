import type { RecordModel } from "@/types/models";
import { formatYen } from "@/lib/currencyFormat";

/**
 * 一般質問ワークフロー等のAI機能（プロトタイプ用モック）。gikai_draft_mock_service.dart の移植。
 * キーワードベースのヒューリスティック実装。本番ではLLM生成に置き換える。
 */

export interface GikaiAnswerSimulation {
  pattern: string;
  rebuttal: string;
}

/**
 * 記録メモの文章から「テーマ」らしい短い語句を抜き出す。以前はここで
 * `content.slice(0, 24) + "…"` のように文字列を丸ごと切り詰めていたため、
 * 省略記号（…）付きの断片がそのままthemeの値として設定され、最終的な
 * 通告書の件名（「{theme}について」）まで「…について」という壊れた文言が
 * 流れ込んでいた。record_flow等の「〜について、一般質問で取り上げたい」
 * という定型的な言い回しを取り除き、値そのものを短くする（表示上の省略は
 * CSS側のtruncateに任せ、文字列に「…」を埋め込まない）。
 */
function extractThemeFromRecord(content: string): string {
  let theme = content.trim().replace(/[。.]+$/, "");
  theme = theme.replace(/[、,]?\s*(を|について)?\s*(次回の)?(一般質問|議会)で(取り上げたい|質問したい|取り上げる|質問する)$/, "");
  theme = theme.replace(/[をに]?ついて$/, "");
  theme = theme.trim();
  return theme.length > 0 ? theme : content.trim();
}

export function suggestThemes(records: RecordModel[]): string[] {
  const fromRecords = records
    .filter((r) => r.categories.includes("question"))
    .map((r) => extractThemeFromRecord(r.content));
  const defaults = ["子育て支援の拡充", "高齢者の移動支援", "防災体制の強化", "空き家対策"];
  return [...fromRecords, ...defaults].slice(0, 5);
}

export function collectMaterials(theme: string): string[] {
  return [
    `他自治体の先進事例：類似規模の自治体における「${theme}」関連施策の導入事例`,
    "関連法令・制度の概要整理",
    "過去の議会での関連質問・答弁の傾向",
    `住民相談記録から見える「${theme}」に関する声`,
  ];
}

export function proposeStructure(theme: string): string[] {
  return [
    `導入（「${theme}」を取り上げる背景・問題提起）`,
    "質問1：現状認識を問う",
    "質問2：具体的な施策を問う",
    "質問3：今後の方針を問う",
    "まとめ（要望・提言）",
  ];
}

export function generateDraft(params: {
  theme: string;
  goal: string;
  refinement?: "concrete" | "short";
}): string {
  const { theme, goal, refinement } = params;
  const base =
    `「${theme}」について、一般質問を行います。\n\n` +
    `本市においても「${theme}」は住民の関心が高いテーマであり、` +
    "他自治体の先進事例や本市の現状を踏まえ、以下の点について市の見解を伺います。\n\n" +
    "第一に、現状の取り組みと課題認識について。\n" +
    "第二に、今後の具体的な施策の方向性について。\n" +
    "第三に、実施にあたってのスケジュールと予算措置について。\n\n" +
    `${goal}の実現に向け、前向きなご答弁をお願いいたします。`;

  if (refinement === "concrete") {
    return `${base}\n\n【補足】住民相談で寄せられた具体的なケースを交え、より現場感のある内容に調整しました。`;
  }
  if (refinement === "short") {
    return `「${theme}」について伺います。本市の現状の取り組みと課題認識、今後の具体的な施策の方向性、実施スケジュールについて、市の見解をお聞かせください。`;
  }
  return base;
}

export function answerSimulations(): GikaiAnswerSimulation[] {
  return [
    {
      pattern: "「現状の取り組みを説明し、引き続き検討していく」という答弁",
      rebuttal: "「検討」の具体的な期限や次のステップを明確にするよう再質問する",
    },
    {
      pattern: "「予算や人員の制約を理由に難色を示す」という答弁",
      rebuttal: "他自治体の実施コストや段階的導入の事例を示し、実現可能性を再質問する",
    },
    {
      pattern: "「前向きに検討し、次年度予算での対応を示唆する」という答弁",
      rebuttal: "対応の対象範囲や住民への周知方法について具体化を求める",
    },
  ];
}

export function generateInspectionReport(params: {
  destination: string;
  date: Date;
  purpose: string;
  notes: string[];
}): string {
  const { destination, date, purpose, notes } = params;
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const noteBlock = notes.length === 0 ? "（現地での気づき・所感は入力されていません）" : notes.map((n) => `・${n}`).join("\n");
  return (
    "【視察報告書】\n\n" +
    `視察先：${destination}\n` +
    `視察日：${dateStr}\n` +
    `目的：${purpose}\n\n` +
    `■現地での所感\n${noteBlock}\n\n` +
    "■まとめ\n" +
    `今回の視察を通じて得られた知見は、本市における「${purpose}」に関連する施策の検討材料として活用する。関係部署と情報共有のうえ、今後の政策提言に反映していきたい。`
  );
}

export function generateSeimuKatsudouhiReport(params: {
  periodLabel: string;
  total: number;
  byCategory: Record<string, number>;
  count: number;
}): string {
  const { periodLabel, total, byCategory, count } = params;
  const entries = Object.entries(byCategory);
  const breakdown =
    entries.length === 0
      ? "（対象期間の経費データがありません）"
      : entries.map(([k, v]) => `・${k}：${formatYen(v)}`).join("\n");
  return (
    "【政務活動費収支報告書】\n\n" +
    `対象期間：${periodLabel}\n` +
    `支出件数：${count}件\n` +
    `支出合計：${formatYen(total)}\n\n` +
    `■費目別内訳\n${breakdown}\n\n` +
    "■備考\n上記は記録された領収書データに基づく自動集計です。提出前に証憑（領収書原本）との突合をお願いします。"
  );
}
