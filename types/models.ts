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

export interface ScheduleModel {
  id: string;
  title: string;
  location?: string;
  startAt: string;
  endAt?: string;
  meetingProvider?: "google_meet" | "zoom";
  meetingUrl?: string;
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

export const expenseCategories = [
  "事務費",
  "広報費",
  "調査研究費",
  "交通費",
  "会議費",
  "その他",
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

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
  content: string;
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
