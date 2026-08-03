import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAppStore, daysSinceLastContact } from "@/store/appStore";
import { classify } from "@/lib/aiClassificationService";
import { fullNameWithHonorific, recordCategoryLabels } from "@/types/models";
import type { ChatMessageModel, PersonModel, TodoModel } from "@/types/models";

/** Flutter版 secretary_mock_service.dart の1:1移植。 */

export function greeting(): string {
  const state = useAppStore.getState();
  const name = fullNameWithHonorific(state.profile);
  const schedules = state.todaySchedules();
  const todos = state.pendingTodos();

  if (schedules.length === 0 && todos.length === 0) {
    return (
      `おはようございます、${name}。` +
      "今日は特に大きなご予定は入っていないので、ゆったり過ごせそうですね。\n" +
      "何かお手伝いできることがあれば、いつでも声をかけてください。"
    );
  }
  const parts: string[] = [];
  if (schedules.length > 0) parts.push(`ご予定が${schedules.length}件`);
  if (todos.length > 0) parts.push(`やることが${todos.length}件`);
  return (
    `おはようございます、${name}。今日は${parts.join("、")}入っていますよ。\n` +
    "今日も一日、よろしくお願いします。"
  );
}

/** 期限切れのToDoについて、美咲から自発的に確認する一言。record_flow等と違い、ここは相手（先生）から
 * の入力を待たず、チャット画面を開いた時点で美咲側から話しかける想定。 */
export function overdueTodoCheckinMessage(todos: TodoModel[]): string {
  if (todos.length === 1) {
    return `先生、「${todos[0].title}」はこちら、完了してますでしょうか？まだでしたら教えてくださいね。`;
  }
  const lines = todos.map((t) => `・${t.title}`).join("\n");
  return `先生、期限を過ぎているタスクがいくつかあります。もう終わっているものはありますか？\n${lines}`;
}

/** 「そろそろ連絡」対象の人物について、美咲から自発的に一声かける。overdueTodoCheckinMessageと
 * 同じく、先生からの入力を待たずチャットを開いた時点で話しかける想定。 */
export function reminderContactCheckinMessage(persons: PersonModel[]): string {
  if (persons.length === 1) {
    const days = daysSinceLastContact(persons[0]);
    return `あと、${persons[0].name}さんとは最終接触から${days}日ほど空いていますね。そろそろご連絡されますか？`;
  }
  const lines = persons.map((p) => `・${p.name}さん（最終接触から${daysSinceLastContact(p)}日）`).join("\n");
  return `あと、しばらく連絡が空いている方が何人かいらっしゃいます。\n${lines}`;
}

export function quickMenuReply(menu: string): string {
  const state = useAppStore.getState();
  switch (menu) {
    case "今日の予定": {
      const schedules = state.todaySchedules();
      if (schedules.length === 0) return "今日のご予定は入っていませんよ。ゆっくりできそうですね。";
      const lines = schedules
        .map((s) => {
          const d = new Date(s.startAt);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          return `・${hh}:${mm} ${s.title}`;
        })
        .join("\n");
      return `今日のご予定はこちらです。\n${lines}`;
    }
    case "ToDo": {
      const todos = state.pendingTodos();
      if (todos.length === 0) return "未完了のやることは今のところありませんよ。すごいですね！";
      const lines = todos.map((t) => `・${t.title}`).join("\n");
      return `未完了のやることはこちらです。\n${lines}`;
    }
    default:
      return "かしこまりました。";
  }
}

/** 「〜をToDoに追加して」のような発話から依頼表現を取り除いてタスク名だけを抜き出す。 */
function extractTodoTitle(trimmed: string): string {
  let title = trimmed;
  title = title.replace(/(ToDo|やること)(に|へ)?/g, "");
  title = title.replace(/を?(追加して|追加し|追加|登録して|登録し|登録|入れておいて|入れて)(ください|くれ)?[。.!！]*$/g, "");
  title = title.trim();
  return title.length === 0 ? "新しいやること" : title;
}

async function askClaude(message: string, history: ChatMessageModel[]): Promise<string> {
  const state = useAppStore.getState();
  const profile = state.profile;
  const { data, error } = await supabase.functions.invoke("secretary-chat", {
    body: {
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      context: {
        displayName: profile.displayName,
        honorific: profile.honorific,
        councilName: profile.councilName,
        todaySchedules: state.todaySchedules().map((s) => {
          const d = new Date(s.startAt);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          return `${hh}:${mm} ${s.title}`;
        }),
        pendingTodos: state.pendingTodos().map((t) => t.title),
        reminderPersons: state.reminderPersons().map((p) => p.name),
      },
    },
  });

  if (error) throw error;
  if (data && typeof data.reply === "string" && data.reply.length > 0) {
    return data.reply as string;
  }
  throw new Error(`secretary-chat returned no reply: ${JSON.stringify(data)}`);
}

export interface FreeformResult {
  reply: string;
  didMutateData: boolean;
}

/**
 * Claude APIが使えない場合のフォールバック。以前は「内容はメモに整理して
 * おきますね」と返しながら実際には何も保存しておらず、口先だけの返信に
 * なっていた（実際には何も起きないのに何かしたように見せる、この
 * セッションで繰り返し避けてきた種類の不誠実さ）。record画面・オンボー
 * ディングと同じclassify()＋addRecordで実際にメモとして保存し、
 * 分類結果を伴った返信にすることで、返信の内容と実際の挙動を一致させる。
 */
function saveAsFallbackRecord(content: string): string {
  const state = useAppStore.getState();
  const result = classify(content);
  state.addRecord({ content, categories: result.categories, aiConfidence: result.confidence });
  const label = recordCategoryLabels[result.categories[0]];
  return `承知しました。「${label}」の記録として保存しておきますね。詳しく話していただければ、続きも整理します。`;
}

/**
 * 自由入力への応答。「やること」追加のような簡単な操作は実際にデータへ反映する
 * （即応性が必要かつ判定が明確なので、キーワード判定のまま処理する）。
 * それ以外は本物のClaude APIに投げて自然な応答を返す。Supabase未接続/
 * Edge Function未デプロイの場合は、実際に記録として保存した上でフォールバック
 * する（下記saveAsFallbackRecord参照）。
 */
export async function freeformReply(
  message: string,
  history: ChatMessageModel[]
): Promise<FreeformResult> {
  const trimmed = message.trim();
  const state = useAppStore.getState();

  if (trimmed.includes("ありがとう")) {
    return { reply: "こちらこそ、いつもありがとうございます。またいつでも声をかけてくださいね。", didMutateData: false };
  }

  if (
    (trimmed.includes("ToDo") || trimmed.includes("やること")) &&
    (trimmed.includes("追加") || trimmed.includes("登録") || trimmed.includes("入れて"))
  ) {
    const safeTitle = extractTodoTitle(trimmed);
    state.addTodo({ title: safeTitle });
    return { reply: `承知しました。「${safeTitle}」をやることに追加しておきますね。`, didMutateData: true };
  }

  if (trimmed.includes("予定") && (trimmed.includes("教えて") || trimmed.includes("？") || trimmed.includes("?"))) {
    return { reply: quickMenuReply("今日の予定"), didMutateData: false };
  }

  if (!isSupabaseConfigured) {
    return { reply: saveAsFallbackRecord(trimmed), didMutateData: true };
  }

  try {
    const reply = await askClaude(trimmed, history);
    return { reply, didMutateData: false };
  } catch {
    return { reply: saveAsFallbackRecord(trimmed), didMutateData: true };
  }
}
