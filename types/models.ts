/**
 * Flutter版 lib/models/*.dart からの1:1移植。
 * フィールド名はDart版のcamelCaseをそのまま踏襲する（Supabase等のDB接続時に
 * snake_case⇄camelCaseの変換層を別途設けるまでは、UIコードは常にこの形を見る）。
 */

export interface PersonModel {
  id: string;
  name: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  memo?: string;
  tags: string[];
  lastContactAt?: string; // ISO 8601
  createdAt: string;
}

/** 投票日・公示日としてカレンダーに登録された予定は、公職選挙法対応のため
 * SNS投稿ブロックの判定にも使う（posting/edit/page.tsx参照）。 */
export type ScheduleSpecialType = "election_day" | "public_notice_day";

export interface ScheduleModel {
  id: string;
  title: string;
  location?: string;
  startAt: string;
  endAt?: string;
  meetingProvider?: "google_meet" | "zoom";
  meetingUrl?: string;
  scheduleType?: ScheduleSpecialType;
}

export type TodoPriority = "high" | "medium" | "low";

export interface TodoModel {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  /** 完了にした日時（完了済み一覧の月別グルーピングに使う）。未完了はundefined。 */
  completedAt?: string;
  priority: TodoPriority;
}

/**
 * 政務活動費の費目区分は自治体条例ごとに異なり、正確な区分数は一つに決められない
 * （簡略化した6費目ではなく、人件費・研修費・要請陳情活動費等を分ける自治体もある）。
 * そのためアプリ内に決め打ちの1セットを持たせず、プリセットから選ぶかカスタム入力
 * できるようにする。「standard8」はよく見られる政務活動費条例の分類例であり、
 * 特定の自治体の正式な区分を表すものではない（あくまで「例」として提示する）。
 */
export const expenseCategoryPresets = {
  generic: {
    label: "シンプル（6費目）",
    categories: ["事務費", "広報費", "調査研究費", "交通費", "会議費", "その他"],
  },
  standard8: {
    label: "詳細（8費目の例）",
    categories: [
      "人件費",
      "事務所費",
      "資料作成費",
      "広聴広報費",
      "調査研究費",
      "研修費",
      "要請陳情活動費",
      "その他",
    ],
  },
} as const;
export type ExpenseCategoryPresetKey = keyof typeof expenseCategoryPresets | "custom";
export const defaultExpenseCategoryPreset: ExpenseCategoryPresetKey = "generic";

/** 現在有効な費目一覧を返す。customはprofile.customExpenseCategoriesを使う（空ならgenericにフォールバック）。 */
export function activeExpenseCategories(profile: {
  expenseCategoryPreset?: ExpenseCategoryPresetKey;
  customExpenseCategories?: string[];
}): string[] {
  const preset = profile.expenseCategoryPreset ?? defaultExpenseCategoryPreset;
  if (preset === "custom") {
    return profile.customExpenseCategories && profile.customExpenseCategories.length > 0
      ? profile.customExpenseCategories
      : expenseCategoryPresets.generic.categories.slice();
  }
  return expenseCategoryPresets[preset].categories.slice();
}

// 後方互換用のデフォルト費目一覧（プリセット未対応の呼び出し元向け）
export const expenseCategories = expenseCategoryPresets.generic.categories;
export type ExpenseCategory = string;

export interface ExpenseModel {
  id: string;
  category: string;
  amount: number;
  store?: string;
  note?: string;
  date: string;
  /** 領収書の写真（data URL）。カメラ/ファイル選択で実際に撮った画像を保持する。 */
  photoUrl?: string;
}

export type ConsultationStatus = "none" | "in_progress" | "waiting" | "done";
export type RecordCategory =
  | "consultation"
  | "person"
  | "question"
  | "expense"
  | "todo"
  | "schedule";

export const recordCategoryLabels: Record<RecordCategory, string> = {
  consultation: "相談メモ",
  person: "人の記録",
  question: "質問ネタ",
  expense: "経費",
  todo: "やること",
  schedule: "予定",
};

export interface RecordModel {
  id: string;
  content: string;
  categories: RecordCategory[];
  aiConfidence?: number;
  tags: string[];
  consultationStatus: ConsultationStatus;
  relatedPersonId?: string;
  createdAt: string;
  /** 「写真を撮る」記録フローで撮影した画像（data URL）。 */
  photoUrl?: string;
}

export interface UserProfileModel {
  displayName: string;
  honorific: string;
  councilName: string;
  termYears: number;
  briefingTime: string;
  briefingEnabled: boolean;
  notifyReminder: boolean;
  notifyTodoDue: boolean;
  notifyNekko: boolean;
  reminderDays: number;
  /** パスワード変更画面の「最終更新」表示用。実際の認証機能は持たないプロトタイプのための表示専用フィールド。 */
  passwordChangedAt?: string;
  /** ねっこの会デジタル会員証のサムネイル写真（data URL）。 */
  avatarPhotoUrl?: string;
  /**
   * ねっこの会に入会した日時（ISO 8601）。未設定＝未入会。
   * 未入会の間は会員証の位置に入会案内カードを表示し、入会すると
   * 会員番号が発行されたデジタル会員証に切り替わる。
   */
  nekkoMemberSince?: string;
  /** 経費の費目プリセット。未設定はgeneric扱い。 */
  expenseCategoryPreset?: ExpenseCategoryPresetKey;
  /** expenseCategoryPreset==="custom"の場合の費目一覧。 */
  customExpenseCategories?: string[];
  /**
   * 投票日（YYYY-MM-DD）。設定すると当日はSNS投稿をブロックする
   * （公職選挙法は投票日当日の選挙運動を禁止しており、通常の活動報告の
   * つもりの投稿が選挙運動と見なされるリスクを避けるための機能）。
   */
  electionDay?: string;
}

export const defaultProfile: UserProfileModel = {
  displayName: "山田太郎",
  honorific: "先生",
  councilName: "大牟田市議会",
  termYears: 3,
  briefingTime: "07:30",
  briefingEnabled: true,
  notifyReminder: true,
  notifyTodoDue: true,
  notifyNekko: true,
  reminderDays: 30,
};

export function fullNameWithHonorific(profile: UserProfileModel): string {
  return `${profile.displayName}${profile.honorific}`;
}

export interface PostDraftModel {
  id: string;
  /** Facebook向けの文面。 */
  content: string;
  /** LINE公式向けの文面（プラットフォームごとにトーンを変えて生成する）。未指定ならFacebook向けと同じ。 */
  lineContent?: string;
  sourceSummary?: string;
  createdAt: string;
}

export const benchmarkPlatforms = ["Facebook", "Instagram", "X", "LINE公式"] as const;
export type BenchmarkPlatform = (typeof benchmarkPlatforms)[number];

export interface BenchmarkAccountModel {
  id: string;
  name: string;
  platform: string;
  handle?: string;
  note?: string;
}

export const gikaiTemplateTypes = {
  tsukoku_sho: "質問通告書",
  shisatsu_hokoku: "視察報告書",
  seimu_katsudo: "政務活動報告書",
  gikaidayori: "議会だより原稿",
} as const;
export type GikaiTemplateType = keyof typeof gikaiTemplateTypes;

export interface GikaiTemplateModel {
  id: string;
  templateType: string;
  templateName: string;
  councilName?: string;
  body: string;
  createdAt: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessageModel {
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface SecretaryPendingCheckin {
  id: string;
  title: string;
}

export interface SecretaryPendingContactReminder {
  id: string;
  name: string;
}

/** AI秘書チャットのメッセージ。期限切れToDoやそろそろ連絡の確認チップを
 * メッセージに紐付けて保持するため、通常のChatMessageModelを拡張する。 */
export interface SecretaryMessageModel extends ChatMessageModel {
  pendingCheckins?: SecretaryPendingCheckin[];
  pendingContactReminders?: SecretaryPendingContactReminder[];
}
