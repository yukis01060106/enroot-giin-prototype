export interface BusinessCardClassification {
  name?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
}

const titleKeywords = [
  "理事", "事務局長", "会長", "副会長", "部長", "課長", "係長", "代表", "社長", "専務", "常務",
  "支部長", "青年部", "女性部", "議員", "秘書", "顧問", "委員長", "会員", "校長", "園長",
];

const organizationKeywords = [
  "株式会社", "有限会社", "合同会社", "事務所", "協会", "会議所", "組合", "団体", "委員会",
  "市議会", "町議会", "村議会", "県議会", "青年会議所", "自治会", "町内会", "商工会",
];

function isPhoneLike(line: string): boolean {
  return /\d{2,4}-\d{2,4}-\d{3,4}/.test(line) || /^[\d\-()\s]+$/.test(line);
}

/**
 * OCRで読み取った名刺の生テキストから氏名・所属・役職・電話・メールを推測する。
 * 名刺のレイアウトは会社ごとにバラバラなため完全な正解は望めない「叩き台」。
 * receiptClassify.tsと同じ方針（会計士/本人の最終確認前提の簡易分類）。
 */
export function classifyBusinessCardText(text: string): BusinessCardClassification {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const phoneMatch = text.match(/(0\d{1,4}-\d{1,4}-\d{3,4})/);
  const phone = phoneMatch?.[1];

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const email = emailMatch?.[0];

  const organization = lines.find((l) => organizationKeywords.some((k) => l.includes(k)));
  const title = lines.find((l) => titleKeywords.some((k) => l.includes(k)));

  // 氏名: 電話・メール・所属・役職のいずれでもない、2〜10文字程度の日本語の行を推測。
  // 名刺は氏名が比較的大きく・単独行で入ることが多いため、この消去法で概ね当たる。
  const name = lines.find(
    (l) =>
      l !== organization &&
      l !== title &&
      l.length >= 2 &&
      l.length <= 10 &&
      !isPhoneLike(l) &&
      !l.includes("@") &&
      /^[一-龠ぁ-んァ-ヶー\s　]+$/.test(l)
  );

  return { name, organization, title, phone, email };
}
