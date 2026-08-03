import { expenseCategories, type ExpenseCategory } from "@/types/models";

export interface ReceiptClassification {
  category: ExpenseCategory;
  amount?: number;
  store?: string;
}

/**
 * OCRで読み取った生テキストから費目・金額・店名を推測する。会計士が最終判断する
 * 前提の「叩き台」であり、キーワード一致数による簡易分類（誤分類はあり得る）。
 * 数値以外の学習は行わないため、レシート文言が薄い/カテゴリ外の店だと
 * 「その他」に落ちる。
 */
const categoryKeywords: Record<ExpenseCategory, string[]> = {
  交通費: ["タクシー", "バス", "ＪＲ", "JR", "西鉄", "鉄道", "電車", "駐車場", "パーキング", "ガソリン", "高速", "ETC", "乗車", "航空", "空港"],
  会議費: ["カフェ", "喫茶", "レストラン", "会議室", "弁当", "居酒屋", "コーヒー", "茶屋", "food", "ダイニング"],
  広報費: ["印刷", "チラシ", "ポスター", "デザイン", "広報", "新聞", "折込", "看板"],
  調査研究費: ["書籍", "図書", "本屋", "文献", "複写", "コピー", "研修", "セミナー", "視察", "資料代"],
  事務費: ["文具", "コンビニ", "事務", "用紙", "郵便", "切手", "封筒", "インク", "トナー", "文房具"],
  その他: [],
};

function extractAmount(text: string): number | undefined {
  const totalMatch = text.match(/(?:合計|総額|お会計|ご請求)[^\d]{0,6}([\d,]{2,})/);
  if (totalMatch) return parseInt(totalMatch[1].replace(/,/g, ""), 10);

  const yenPrefixed = [...text.matchAll(/¥\s?([\d,]{2,})/g)].map((m) => parseInt(m[1].replace(/,/g, ""), 10));
  if (yenPrefixed.length > 0) return Math.max(...yenPrefixed);

  const yenSuffixed = [...text.matchAll(/([\d,]{3,})\s?円/g)].map((m) => parseInt(m[1].replace(/,/g, ""), 10));
  if (yenSuffixed.length > 0) return Math.max(...yenSuffixed);

  return undefined;
}

function extractStoreName(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // レシートは通常1〜2行目に店名が来る。数字だけ・記号だけの行（電話番号や罫線）は除く。
  return lines.find((l) => l.length >= 2 && l.length <= 24 && !/^[\d\-()０-９（）ー\s]+$/.test(l));
}

export function classifyReceiptText(text: string): ReceiptClassification {
  const normalized = text.replace(/\s+/g, " ");

  let bestCategory: ExpenseCategory = "その他";
  let bestScore = 0;
  for (const category of expenseCategories) {
    const keywords = categoryKeywords[category];
    const score = keywords.reduce((n, kw) => n + (normalized.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return {
    category: bestCategory,
    amount: extractAmount(normalized),
    store: extractStoreName(text),
  };
}
