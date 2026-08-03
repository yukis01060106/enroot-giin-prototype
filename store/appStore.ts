import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  BenchmarkAccountModel,
  ExpenseModel,
  GikaiTemplateModel,
  PersonModel,
  PostDraftModel,
  RecordModel,
  RecordCategory,
  ScheduleModel,
  TodoModel,
  TodoPriority,
  UserProfileModel,
} from "@/types/models";
import { defaultProfile } from "@/types/models";

/** 経費画面の月次予算（政務活動費のモック上限）。 */
export const monthlyExpenseBudget = 100000;
/** 発信の週次目標回数。 */
export const weeklyPostingTarget = 2;

const DEFAULT_PRESET_PERSON_TAGS = ["町内会", "PTA", "商工会", "後援会", "支援者", "議員", "行政"];

export type PlanTier = "free" | "pro";
export const planLimits: Record<PlanTier, { records: number; persons: number }> = {
  free: { records: 30, persons: 50 },
  pro: { records: 1000, persons: 1000 },
};

interface AppState {
  records: RecordModel[];
  persons: PersonModel[];
  schedules: ScheduleModel[];
  todos: TodoModel[];
  expenses: ExpenseModel[];
  postDrafts: PostDraftModel[];
  benchmarkAccounts: BenchmarkAccountModel[];
  weeklyFacebookCount: number;
  weeklyLineCount: number;
  profile: UserProfileModel;
  gikaiTemplates: GikaiTemplateModel[];

  /** 名刺管理のタグ候補。設定画面（/settings/tags）から追加・削除できる。 */
  presetPersonTags: string[];
  addPresetPersonTag: (tag: string) => void;
  removePresetPersonTag: (tag: string) => void;

  planTier: PlanTier;
  setPlanTier: (tier: PlanTier) => void;

  /** オンライン会議のデフォルト設定（/meetings の「会議設定」から変更）。 */
  defaultMeetingProvider: "google_meet" | "zoom";
  defaultMeetingDurationMin: number;
  updateMeetingDefaults: (params: { provider?: "google_meet" | "zoom"; durationMin?: number }) => void;

  /** 設定画面「アカウント削除」用。プロフィール以外の全データを初期状態に戻し、オンボーディングからやり直させる。 */
  resetAllData: () => void;

  /** ねっこの会の次回開催（ISO日時）への参加登録。日時ごとに管理するので、開催が終われば自然に未登録へ戻る。 */
  nekkoRsvpFor: string | null;
  setNekkoRsvp: (dateIso: string | null) => void;

  /**
   * Flutter版 main.dart が SharedPreferences から同期読みしていた2つのフラグ。
   * output:'export' はミドルウェア/サーバー側リダイレクトが使えないため、
   * クライアント側でこのpersist済みlocalStorage値を見て初回起動判定する。
   */
  onboardingComplete: boolean;
  hasOpenedHome: boolean;
  completeOnboarding: () => void;
  markHomeOpened: () => void;

  updateProfile: (update: (current: UserProfileModel) => UserProfileModel) => void;
  addRecord: (params: {
    content: string;
    categories: RecordCategory[];
    aiConfidence?: number;
    photoUrl?: string;
  }) => void;
  addSchedule: (params: {
    title: string;
    location?: string;
    startAt: string;
    endAt?: string;
  }) => void;
  addMeeting: (params: {
    title: string;
    provider: "google_meet" | "zoom";
    startAt: string;
    endAt?: string;
  }) => ScheduleModel;
  addTodo: (params: { title: string; dueDate?: string; priority?: TodoPriority }) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, params: { title?: string; dueDate?: string | null; priority?: TodoPriority }) => void;
  removeTodo: (id: string) => void;
  addBenchmarkAccount: (params: {
    name: string;
    platform: string;
    handle?: string;
    note?: string;
  }) => void;
  removeBenchmarkAccount: (id: string) => void;
  addGikaiTemplate: (params: {
    templateType: string;
    templateName: string;
    councilName?: string;
    body: string;
  }) => void;
  removeGikaiTemplate: (id: string) => void;
  updateConsultationStatus: (recordId: string, status: RecordModel["consultationStatus"]) => void;
  updatePersonTags: (personId: string, tags: string[]) => void;
  addPerson: (params: {
    name: string;
    organization?: string;
    title?: string;
    phone?: string;
    email?: string;
    memo?: string;
  }) => PersonModel;
  updatePerson: (
    id: string,
    params: { name?: string; organization?: string; title?: string; phone?: string; email?: string; memo?: string }
  ) => void;
  removePerson: (id: string) => void;
  /** 「そろそろ連絡」リマインドの唯一の解消手段。これがないと一度しきい値を
   * 超えた人物が永久にリマインドされ続けてしまう。 */
  logContact: (id: string) => void;
  addExpense: (params: {
    category: string;
    amount: number;
    store?: string;
    note?: string;
    date?: string;
    photoUrl?: string;
  }) => void;
  publishPost: (params: { toFacebook: boolean; toLine: boolean; draftId?: string }) => void;
  addPostDraft: (params: { content: string; lineContent?: string; sourceSummary?: string }) => PostDraftModel;
  removePostDraft: (id: string) => void;

  // 派生ゲッター（Dartのgetterと同じくFlutter版は毎回計算、メモ化はしない）
  meetings: () => ScheduleModel[];
  todaySchedules: () => ScheduleModel[];
  pendingTodos: () => TodoModel[];
  overdueTodos: () => TodoModel[];
  reminderPersons: () => PersonModel[];
  thisMonthExpenses: () => ExpenseModel[];
  thisMonthExpensesByCategory: () => Record<string, number>;
  thisMonthExpenseTotal: () => number;
}

function daysSinceLastContact(person: PersonModel): number | undefined {
  if (!person.lastContactAt) return undefined;
  const diffMs = Date.now() - new Date(person.lastContactAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function mockMeetUrl(): string {
  const seg = (n: number) =>
    Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function mockZoomUrl(): string {
  const id = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  return `https://zoom.us/j/${id}`;
}

/** Flutter版 _seedData の1:1移植。アプリ起動のたびに再生成される（profile以外は非永続）。 */
function seedData(profile: UserProfileModel) {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysFromNow = (d: number, h = 0) =>
    new Date(now.getTime() + d * 86400000 + h * 3600000).toISOString();
  const atTime = (h: number, m: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).toISOString();
  const atTimeOffset = (d: number, h: number) =>
    new Date(now.getTime() + d * 86400000 + h * 3600000).toISOString();
  const clampDay = (offset: number) =>
    new Date(now.getFullYear(), now.getMonth(), Math.min(Math.max(now.getDate() - offset, 1), now.getDate())).toISOString();

  const persons: PersonModel[] = [
    {
      id: "p1",
      name: "田中太郎",
      organization: "本町一丁目町内会",
      title: "会長",
      phone: "090-1234-5678",
      tags: ["町内会", "支援者"],
      lastContactAt: daysAgo(45),
      createdAt: daysAgo(200),
    },
    {
      id: "p2",
      name: "佐藤花子",
      organization: "大牟田商工会議所",
      title: "青年部部長",
      phone: "0944-12-3456",
      tags: ["商工会"],
      lastContactAt: daysAgo(5),
      createdAt: daysAgo(90),
    },
    {
      id: "p3",
      name: "鈴木一郎",
      organization: "第三小学校PTA",
      title: "副会長",
      tags: ["PTA"],
      lastContactAt: daysAgo(33),
      createdAt: daysAgo(60),
    },
  ];

  const records: RecordModel[] = [
    {
      id: "r1",
      content: "本町一丁目の道路の街灯が切れているとの相談。田中さんから連絡。",
      categories: ["consultation", "person"],
      aiConfidence: 0.9,
      tags: [],
      consultationStatus: "none",
      relatedPersonId: "p1",
      createdAt: daysAgo(2),
    },
    {
      id: "r2",
      content: "子育て支援の拡充について、次回の一般質問で取り上げたい。",
      categories: ["question"],
      aiConfidence: 0.85,
      tags: [],
      consultationStatus: "none",
      createdAt: daysAgo(1),
    },
  ];

  const schedules: ScheduleModel[] = [
    { id: "s1", title: "本会議", location: "議会棟 本会議場", startAt: atTime(10, 0) },
    { id: "s2", title: "商工会議所 懇談会", location: "大牟田商工会議所", startAt: atTime(15, 0) },
    {
      id: "s3",
      title: "会派定例ミーティング",
      startAt: atTime(19, 0),
      endAt: atTime(20, 0),
      meetingProvider: "google_meet",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: "s4",
      title: "住民相談（鈴木様）",
      startAt: atTimeOffset(3, 2),
      endAt: atTimeOffset(3, 3),
      meetingProvider: "zoom",
      meetingUrl: "https://zoom.us/j/8213456789",
    },
    {
      id: "s5",
      title: "ねっこの会 前回定例",
      startAt: atTimeOffset(-25, 0),
      endAt: atTimeOffset(-25, 1),
      meetingProvider: "google_meet",
      meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
    },
  ];

  const todos: TodoModel[] = [
    { id: "t1", title: "街灯修繕を道路課に連絡", dueDate: atTime(0, 0), isCompleted: false, priority: "high" },
    { id: "t2", title: "一般質問の原稿作成", dueDate: daysFromNow(5), isCompleted: false, priority: "medium" },
    { id: "t3", title: "住民相談の対応記録をまとめる", dueDate: daysAgo(2), isCompleted: false, priority: "high" },
    { id: "t4", title: "議会だより原稿の確認", isCompleted: false, priority: "low" },
    {
      id: "t5",
      title: "商工会議所への挨拶回り",
      dueDate: daysAgo(3),
      isCompleted: true,
      completedAt: daysAgo(3),
      priority: "medium",
    },
    {
      id: "t6",
      title: "視察報告書の提出",
      dueDate: daysAgo(20),
      isCompleted: true,
      completedAt: daysAgo(18),
      priority: "high",
    },
    {
      id: "t7",
      title: "町内会の役員会に出席",
      dueDate: daysAgo(45),
      isCompleted: true,
      completedAt: daysAgo(45),
      priority: "low",
    },
  ];

  const expenses: ExpenseModel[] = [
    {
      id: "e1",
      category: "広報費",
      amount: 8000,
      store: "まちだ印刷",
      note: "議会だより印刷代",
      date: clampDay(1),
    },
    { id: "e2", category: "交通費", amount: 1200, store: "JR九州", date: clampDay(2) },
    {
      id: "e3",
      category: "調査研究費",
      amount: 15000,
      store: "福岡県立図書館",
      note: "政策資料の複写代",
      date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    },
  ];

  const postDrafts: PostDraftModel[] = [
    {
      id: "d1",
      content:
        "本日、本町一丁目で街灯修繕についてご相談をいただきました。市の道路課と連携し、早期の対応を進めてまいります。",
      sourceSummary: "本町一丁目の道路の街灯が切れているとの相談",
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
    },
    {
      id: "d2",
      content: "大牟田商工会議所の懇談会に参加しました。青年部の皆さまと地域経済の活性化について意見交換を行いました。",
      sourceSummary: "商工会議所 懇談会",
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
  ];

  const benchmarkAccounts: BenchmarkAccountModel[] = [
    {
      id: "b1",
      name: "〇〇市議会議員 山田はなこ",
      platform: "Instagram",
      handle: "@yamada_giin",
      note: "写真中心で親しみやすい発信スタイルが参考になる",
    },
  ];

  const gikaiTemplates: GikaiTemplateModel[] = [
    {
      id: "tmpl1",
      templateType: "tsukoku_sho",
      templateName: "標準通告書フォーマット",
      councilName: "大牟田市議会",
      body: "件名・質問要旨・質問項目の3段構成。提出は開会日の3日前まで。",
      createdAt: daysAgo(120),
    },
  ];

  return {
    persons,
    records,
    schedules,
    todos,
    expenses,
    postDrafts,
    benchmarkAccounts,
    weeklyFacebookCount: 1,
    weeklyLineCount: 0,
    profile,
    gikaiTemplates,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...seedData(defaultProfile),
      onboardingComplete: false,
      hasOpenedHome: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      markHomeOpened: () => set({ hasOpenedHome: true }),

      presetPersonTags: [...DEFAULT_PRESET_PERSON_TAGS],
      addPresetPersonTag: (tag) =>
        set((state) =>
          state.presetPersonTags.includes(tag)
            ? state
            : { presetPersonTags: [...state.presetPersonTags, tag] }
        ),
      removePresetPersonTag: (tag) =>
        set((state) => ({ presetPersonTags: state.presetPersonTags.filter((t) => t !== tag) })),

      planTier: "free",
      setPlanTier: (tier) => set({ planTier: tier }),

      defaultMeetingProvider: "google_meet",
      defaultMeetingDurationMin: 30,
      updateMeetingDefaults: ({ provider, durationMin }) =>
        set((state) => ({
          defaultMeetingProvider: provider ?? state.defaultMeetingProvider,
          defaultMeetingDurationMin: durationMin ?? state.defaultMeetingDurationMin,
        })),

      // setはshallowマージなので、ここで返さないミューテーター/派生ゲッター関数群は
      // そのまま維持される（seedData()はデータフィールドのみを返す設計）。
      resetAllData: () =>
        set(() => ({
          ...seedData(defaultProfile),
          presetPersonTags: [...DEFAULT_PRESET_PERSON_TAGS],
          planTier: "free",
          defaultMeetingProvider: "google_meet",
          defaultMeetingDurationMin: 30,
          onboardingComplete: false,
          hasOpenedHome: false,
          nekkoRsvpFor: null,
        })),

      nekkoRsvpFor: null,
      setNekkoRsvp: (dateIso) => set({ nekkoRsvpFor: dateIso }),

      updateProfile: (update) =>
        set((state) => ({ profile: update(state.profile) })),

      addRecord: ({ content, categories, aiConfidence, photoUrl }) => {
        const now = new Date();
        const id = `r_${now.getTime()}`;
        const record: RecordModel = {
          id,
          content,
          categories,
          aiConfidence,
          photoUrl,
          tags: [],
          consultationStatus: "none",
          createdAt: now.toISOString(),
        };
        set((state) => {
          let schedules = state.schedules;
          let todos = state.todos;
          const shortTitle = content.length > 20 ? `${content.slice(0, 20)}…` : content;
          if (categories.includes("schedule")) {
            schedules = [
              ...schedules,
              {
                id: `auto_s_${now.getTime()}`,
                title: shortTitle,
                startAt: new Date(now.getTime() + 86400000).toISOString(),
              },
            ];
          }
          if (categories.includes("todo")) {
            todos = [
              ...todos,
              {
                id: `auto_t_${now.getTime()}`,
                title: shortTitle,
                dueDate: new Date(now.getTime() + 3 * 86400000).toISOString(),
                isCompleted: false,
                priority: "medium",
              },
            ];
          }
          return { records: [record, ...state.records], schedules, todos };
        });
      },

      addSchedule: ({ title, location, startAt, endAt }) =>
        set((state) => ({
          schedules: [
            ...state.schedules,
            { id: `manual_s_${Date.now()}`, title, location, startAt, endAt },
          ],
        })),

      addMeeting: ({ title, provider, startAt, endAt }) => {
        const meeting: ScheduleModel = {
          id: `meeting_${Date.now()}`,
          title,
          startAt,
          endAt,
          meetingProvider: provider,
          meetingUrl: provider === "zoom" ? mockZoomUrl() : mockMeetUrl(),
        };
        set((state) => ({ schedules: [...state.schedules, meeting] }));
        return meeting;
      },

      addTodo: ({ title, dueDate, priority }) =>
        set((state) => ({
          todos: [
            ...state.todos,
            { id: `manual_t_${Date.now()}`, title, dueDate, isCompleted: false, priority: priority ?? "medium" },
          ],
        })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : undefined }
              : t
          ),
        })),

      updateTodo: (id, params) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...(params.title !== undefined && { title: params.title }),
                  ...(params.dueDate !== undefined && { dueDate: params.dueDate ?? undefined }),
                  ...(params.priority !== undefined && { priority: params.priority }),
                }
              : t
          ),
        })),

      removeTodo: (id) => set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),

      addBenchmarkAccount: ({ name, platform, handle, note }) =>
        set((state) => ({
          benchmarkAccounts: [
            ...state.benchmarkAccounts,
            { id: `bm_${Date.now()}`, name, platform, handle, note },
          ],
        })),

      removeBenchmarkAccount: (id) =>
        set((state) => ({
          benchmarkAccounts: state.benchmarkAccounts.filter((b) => b.id !== id),
        })),

      addGikaiTemplate: ({ templateType, templateName, councilName, body }) =>
        set((state) => ({
          gikaiTemplates: [
            ...state.gikaiTemplates,
            {
              id: `gt_${Date.now()}`,
              templateType,
              templateName,
              councilName,
              body,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeGikaiTemplate: (id) =>
        set((state) => ({
          gikaiTemplates: state.gikaiTemplates.filter((t) => t.id !== id),
        })),

      updateConsultationStatus: (recordId, status) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId ? { ...r, consultationStatus: status } : r
          ),
        })),

      updatePersonTags: (personId, tags) =>
        set((state) => ({
          persons: state.persons.map((p) => (p.id === personId ? { ...p, tags } : p)),
        })),

      updatePerson: (id, params) =>
        set((state) => ({
          persons: state.persons.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...(params.name !== undefined && { name: params.name }),
                  ...(params.organization !== undefined && { organization: params.organization }),
                  ...(params.title !== undefined && { title: params.title }),
                  ...(params.phone !== undefined && { phone: params.phone }),
                  ...(params.email !== undefined && { email: params.email }),
                  ...(params.memo !== undefined && { memo: params.memo }),
                }
              : p
          ),
        })),

      removePerson: (id) => set((state) => ({ persons: state.persons.filter((p) => p.id !== id) })),

      logContact: (id) =>
        set((state) => ({
          persons: state.persons.map((p) => (p.id === id ? { ...p, lastContactAt: new Date().toISOString() } : p)),
        })),

      addPerson: ({ name, organization, title, phone, email, memo }) => {
        const person: PersonModel = {
          id: `p_${Date.now()}`,
          name,
          organization,
          title,
          phone,
          email,
          memo,
          tags: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ persons: [person, ...state.persons] }));
        return person;
      },

      addExpense: ({ category, amount, store, note, date, photoUrl }) =>
        set((state) => ({
          expenses: [
            {
              id: `e_${Date.now()}`,
              category,
              amount,
              store,
              note,
              date: date ?? new Date().toISOString(),
              photoUrl,
            },
            ...state.expenses,
          ],
        })),

      addPostDraft: ({ content, lineContent, sourceSummary }) => {
        const draft: PostDraftModel = {
          id: `pd_${Date.now()}`,
          content,
          lineContent,
          sourceSummary,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ postDrafts: [draft, ...state.postDrafts] }));
        return draft;
      },

      removePostDraft: (id) => set((state) => ({ postDrafts: state.postDrafts.filter((d) => d.id !== id) })),

      publishPost: ({ toFacebook, toLine, draftId }) =>
        set((state) => ({
          postDrafts: draftId
            ? state.postDrafts.filter((d) => d.id !== draftId)
            : state.postDrafts,
          weeklyFacebookCount: state.weeklyFacebookCount + (toFacebook ? 1 : 0),
          weeklyLineCount: state.weeklyLineCount + (toLine ? 1 : 0),
        })),

      meetings: () => {
        const state = get();
        return [...state.schedules]
          .filter((s) => !!s.meetingUrl)
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      },

      todaySchedules: () => {
        const state = get();
        const now = new Date();
        return state.schedules
          .filter((s) => {
            const d = new Date(s.startAt);
            return (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate()
            );
          })
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      },

      pendingTodos: () => {
        const state = get();
        return [...state.todos]
          .filter((t) => !t.isCompleted)
          .sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });
      },

      overdueTodos: () => {
        const state = get();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return [...state.todos]
          .filter((t) => !t.isCompleted && !!t.dueDate && new Date(t.dueDate) < todayStart)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      },

      reminderPersons: () => {
        const state = get();
        const threshold = state.profile.reminderDays;
        return state.persons
          .filter((p) => (daysSinceLastContact(p) ?? 999) >= threshold)
          .sort((a, b) => (daysSinceLastContact(b) ?? 0) - (daysSinceLastContact(a) ?? 0));
      },

      thisMonthExpenses: () => {
        const state = get();
        const now = new Date();
        return [...state.expenses]
          .filter((e) => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      thisMonthExpensesByCategory: () => {
        const list = get().thisMonthExpenses();
        const map: Record<string, number> = {};
        for (const e of list) {
          map[e.category] = (map[e.category] ?? 0) + e.amount;
        }
        return map;
      },

      thisMonthExpenseTotal: () =>
        get()
          .thisMonthExpenses()
          .reduce((sum, e) => sum + e.amount, 0),
    }),
    {
      name: "enroot-app-storage",
      // profile / onboardingComplete / hasOpenedHome / presetPersonTags のみ永続化。
      // それ以外は毎回seedDataで再生成される（Flutter版がSharedPreferencesに
      // profile等しか保存しないのと同じ仕様。presetPersonTagsはNext.js版で
      // 新たに設定可能にした項目なのでこちらも永続化対象に加える）。
      partialize: (state) => ({
        profile: state.profile,
        onboardingComplete: state.onboardingComplete,
        hasOpenedHome: state.hasOpenedHome,
        presetPersonTags: state.presetPersonTags,
        planTier: state.planTier,
        defaultMeetingProvider: state.defaultMeetingProvider,
        defaultMeetingDurationMin: state.defaultMeetingDurationMin,
        nekkoRsvpFor: state.nekkoRsvpFor,
      }),
      // output:'export'でもnext buildはクライアントコンポーネントを一度サーバー側で
      // プリレンダーする。その際windowもlocalStorageも存在しないため、自動リハイドレーションを
      // 無効化し、useStoreHydrated()内でマウント後にのみ明示的にrehydrate()する。
      skipHydration: true,
    }
  )
);

export { daysSinceLastContact };

/**
 * 派生ゲッター（配列・オブジェクトを返す）をReactコンポーネントから読むための
 * 専用フック群。
 *
 * 注意: `useAppStore(s => s.pendingTodos())` のように直接呼び出すと、呼ぶたびに
 * 新しい配列インスタンスが返るため、Zustandの useSyncExternalStore がスナップショットを
 * 「毎回変化した」と判定し続けて無限リレンダー（React error #185）になる。
 * useShallow で浅い等価比較に切り替えることで、中身が同じなら再レンダーしないように
 * ここで一括対処する（呼び出し側は普通のフックとして使うだけでよい）。
 */
export const useMeetings = () => useAppStore(useShallow((s) => s.meetings()));
export const useTodaySchedules = () => useAppStore(useShallow((s) => s.todaySchedules()));
export const usePendingTodos = () => useAppStore(useShallow((s) => s.pendingTodos()));
export const useOverdueTodos = () => useAppStore(useShallow((s) => s.overdueTodos()));
export const useReminderPersons = () => useAppStore(useShallow((s) => s.reminderPersons()));
export const useThisMonthExpenses = () => useAppStore(useShallow((s) => s.thisMonthExpenses()));
export const useThisMonthExpensesByCategory = () =>
  useAppStore(useShallow((s) => s.thisMonthExpensesByCategory()));
export const useThisMonthExpenseTotal = () => useAppStore((s) => s.thisMonthExpenseTotal());

/**
 * skipHydration:true にしているため、明示的に rehydrate() を呼ぶまで
 * localStorageの内容はstateに反映されない（サーバープリレンダー時に
 * window/localStorageが存在せず落ちるのを防ぐため）。このフックがマウント後に
 * 一度だけrehydrate()を呼び、完了するまでfalseを返す。
 */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    useAppStore.persist.rehydrate();
    return unsub;
  }, []);
  return hydrated;
}
