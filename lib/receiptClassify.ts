export interface ReceiptClassification {
  category: string;
  amount?: number;
  store?: string;
}

/**
 * OCRで読み取った生テキストから費目・金額・店名を推測する。会計士が最終判断する
 * 前提の「叩き台」であり、キーワード一致数による簡易分類（誤分類はあり得る）。
 * 数値以外の学習は行わないため、レシート文言が薄い/カテゴリ外の店だと
 * 費目一覧の最後（通常「その他」）に落ちる。
 *
 * 費目セットは自治体プリセットやカスタム入力で変わり得るため、固定の費目名には
 * 依存しない。まず支出の「概念」（交通・会議・広報・調査研究・事務）に分類し、
 * それを費目名に含まれるキーワード（例:「交通」「会議」）で実際の費目一覧へ
 * マッピングする2段構えにすることで、費目セットが変わっても分類器を作り直さずに
 * 対応できるようにしている。
 */
type ConceptBucket = "transport" | "meeting" | "pr" | "research" | "office";

const conceptKeywords: Record<ConceptBucket, string[]> = {
  transport: ["タクシー", "バス", "ＪＲ", "JR", "西鉄", "鉄道", "電車", "駐車場", "パーキング", "ガソリン", "高速", "ETC", "乗車", "航空", "空港"],
  meeting: ["カフェ", "喫茶", "レストラン", "会議室", "弁当", "居酒屋", "コーヒー", "茶屋", "food", "ダイニング"],
  pr: ["印刷", "チラシ", "ポスター", "デザイン", "広報", "新聞", "折込", "看板"],
  research: ["書籍", "図書", "本屋", "文献", "複写", "コピー", "研修", "セミナー", "視察", "資料代"],
  office: ["文具", "コンビニ", "事務", "用紙", "郵便", "切手", "封筒", "インク", "トナー", "文房具"],
};

const conceptToLabelPattern: Record<ConceptBucket, RegExp> = {
  transport: /交通/,
  meeting: /会議|陳情|要請|懇談/,
  pr: /広報|広聴/,
  research: /調査|研究|研修/,
  office: /事務|資料/,
};

function categoryForConcept(concept: ConceptBucket, categories: string[]): string | undefined {
  const pattern = conceptToLabelPattern[concept];
  return categories.find((c) => pattern.test(c));
}

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

/** @param categories 分類の候補となる費目一覧（自治体プリセット/カスタムを反映した現在の有効な一覧）。空配列は不可。 */
export function classifyReceiptText(text: string, categories: string[]): ReceiptClassification {
  const normalized = text.replace(/\s+/g, " ");
  const fallbackCategory = categories[categories.length - 1] ?? "その他";

  let bestConcept: ConceptBucket | null = null;
  let bestScore = 0;
  for (const concept of Object.keys(conceptKeywords) as ConceptBucket[]) {
    const score = conceptKeywords[concept].reduce((n, kw) => n + (normalized.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestConcept = concept;
    }
  }

  const category = (bestConcept && categoryForConcept(bestConcept, categories)) || fallbackCategory;

  return {
    category,
    amount: extractAmount(normalized),
    store: extractStoreName(text),
  };
}
