import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAppStore } from "@/store/appStore";
import { fullNameWithHonorific } from "@/types/models";
import type { ChatMessageModel } from "@/types/models";

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
    case "名刺管理": {
      const reminders = state.reminderPersons();
      if (reminders.length === 0) return "しばらく連絡が途絶えている方は、今のところいらっしゃいませんよ。";
      const lines = reminders
        .map((p) => {
          const days = p.lastContactAt
            ? Math.floor((Date.now() - new Date(p.lastContactAt).getTime()) / 86400000)
            : 999;
          return `・${p.name}さん（最終接触から${days}日）`;
        })
        .join("\n");
      return `そろそろご連絡してみてはいかがでしょうか。\n${lines}`;
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
 * 自由入力への応答。「やること」追加のような簡単な操作は実際にデータへ反映する
 * （即応性が必要かつ判定が明確なので、キーワード判定のまま処理する）。
 * それ以外は本物のClaude APIに投げて自然な応答を返す。Supabase未接続/
 * Edge Function未デプロイの場合は定型文にフォールバックする。
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
    return {
      reply: "承知しました。よろしければ、もう少し詳しく教えてください。内容はメモに整理しておきますね。",
      didMutateData: false,
    };
  }

  try {
    const reply = await askClaude(trimmed, history);
    return { reply, didMutateData: false };
  } catch {
    return {
      reply: "承知しました。よろしければ、もう少し詳しく教えてください。内容はメモに整理しておきますね。",
      didMutateData: false,
    };
  }
}
