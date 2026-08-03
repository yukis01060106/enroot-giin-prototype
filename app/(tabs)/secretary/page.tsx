"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, Volume2, VolumeX, Check, X, Loader2, Calendar, ListTodo, Bot, WifiOff, Phone } from "lucide-react";
import { SpeakingCharacter } from "@/components/character/SpeakingCharacter";
import { useSpeakingCharacter } from "@/lib/useSpeakingCharacter";
import {
  greeting,
  quickMenuReply,
  freeformReply,
  overdueTodoCheckinMessage,
  reminderContactCheckinMessage,
} from "@/lib/secretaryService";
import { useAppStore } from "@/store/appStore";
import { withBasePath } from "@/lib/basePath";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { SecretaryPendingCheckin, SecretaryPendingContactReminder } from "@/types/models";

const quickMenuItems = [
  { label: "今日の予定", icon: Calendar },
  { label: "ToDo", icon: ListTodo },
];
const secretaryName = "藤堂 美咲";
const mockChatTranscripts = [
  "今日の予定を教えて",
  "田中さんに連絡するのを忘れないようにしたい",
  "一般質問の準備について相談したい",
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SecretaryPage() {
  // タブを切り替えて秘書画面に戻るたびに会話が消え、挨拶と期限切れToDoの
  // 確認が毎回やり直しになっていたため、会話はページのローカルstateではなく
  // ストア（アプリのセッション中は保持される）に置く。
  const messages = useAppStore((s) => s.secretaryMessages);
  const setMessages = useAppStore((s) => s.setSecretaryMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // 一旦デフォルトOFF（Google Cloud TTS未設定の環境ではブラウザ標準TTSの
  // 機械的な声が毎回自動再生されてしまうため）。スピーカーアイコンで手動ON可能。
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, viseme, speak } = useSpeakingCharacter();
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const logContact = useAppStore((s) => s.logContact);

  useEffect(() => {
    // 会話が既にある（前回訪問時の続き、またはこのeffectの二重発火）なら
    // 挨拶をやり直さない。
    if (useAppStore.getState().secretaryMessages.length > 0) return;
    const text = greeting();
    setMessages([{ role: "assistant", content: text, createdAt: new Date().toISOString() }]);
    if (voiceEnabled) speak(text);

    // 期限切れのToDo・そろそろ連絡の人物があれば、こちらから聞かれる前に
    // 美咲から順番に確認してもらう（両方あれば「ところで」と続けて話しかける
    // 自然な多段会話にするため、後者は前者の表示完了を待ってから出す）。
    // 確認チップはそれぞれのメッセージ自身に紐付けておき、後でどれだけ会話が
    // 続いても常にこの発言の直下に表示されるようにする（会話末尾に別枠で
    // 出すと、後続の会話に埋もれて何の確認か分からなくなるため）。
    const overdue = useAppStore.getState().overdueTodos();
    const reminders = useAppStore.getState().reminderPersons();
    let delay = 400;

    if (overdue.length > 0) {
      window.setTimeout(() => setIsTyping(true), delay);
      window.setTimeout(() => {
        setIsTyping(false);
        const checkinText = overdueTodoCheckinMessage(overdue);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: checkinText,
            createdAt: new Date().toISOString(),
            pendingCheckins: overdue.map((t) => ({ id: t.id, title: t.title })),
          },
        ]);
        if (voiceEnabled) speak(checkinText);
      }, delay + 600);
      delay += 1100;
    }

    if (reminders.length > 0) {
      window.setTimeout(() => setIsTyping(true), delay);
      window.setTimeout(() => {
        setIsTyping(false);
        const reminderText = reminderContactCheckinMessage(reminders);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reminderText,
            createdAt: new Date().toISOString(),
            pendingContactReminders: reminders.map((p) => ({ id: p.id, name: p.name })),
          },
        ]);
        if (voiceEnabled) speak(reminderText);
      }, delay + 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function pushAssistant(content: string) {
    setMessages((prev) => [...prev, { role: "assistant", content, createdAt: new Date().toISOString() }]);
    if (voiceEnabled) speak(content);
  }

  async function sendUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    const history = messages;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed, createdAt: new Date().toISOString() }]);
    setIsTyping(true);
    const result = await freeformReply(trimmed, history);
    setIsTyping(false);
    pushAssistant(result.reply);
  }

  function respondToCheckin(messageIndex: number, todo: SecretaryPendingCheckin, done: boolean) {
    // 応答したToDoだけをそのメッセージのpendingCheckinsから外す（他に確認待ちが
    // 残っていればチップは表示され続ける）。
    setMessages((prev) =>
      prev.map((m, i) =>
        i === messageIndex
          ? { ...m, pendingCheckins: m.pendingCheckins?.filter((p) => p.id !== todo.id) }
          : m
      )
    );
    if (done) {
      toggleTodo(todo.id);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `「${todo.title}」は完了しました`, createdAt: new Date().toISOString() },
      ]);
      pushAssistant("ありがとうございます、完了にしておきますね！");
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `「${todo.title}」はまだです`, createdAt: new Date().toISOString() },
      ]);
      pushAssistant("承知しました。無理のない範囲で、引き続きよろしくお願いします。");
    }
  }

  function respondToContactReminder(
    messageIndex: number,
    person: SecretaryPendingContactReminder,
    contacted: boolean
  ) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === messageIndex
          ? { ...m, pendingContactReminders: m.pendingContactReminders?.filter((p) => p.id !== person.id) }
          : m
      )
    );
    if (contacted) {
      logContact(person.id);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `${person.name}さんに連絡しました`, createdAt: new Date().toISOString() },
      ]);
      pushAssistant("ありがとうございます、最終接触日を更新しておきますね。");
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `${person.name}さんへの連絡はまた今度にします`, createdAt: new Date().toISOString() },
      ]);
      pushAssistant("承知しました。またタイミングを見てお声がけしますね。");
    }
  }

  async function toggleVoiceInput() {
    if (voiceTranscribing) return;
    if (!voiceRecording) {
      setVoiceRecording(true);
      return;
    }
    setVoiceRecording(false);
    setVoiceTranscribing(true);
    // 実際には音声認識APIの結果をここで受け取る。今は録音内容に関わらずモックの文言を返す。
    await new Promise((r) => setTimeout(r, 1200));
    const mock = mockChatTranscripts[Math.floor(Math.random() * mockChatTranscripts.length)];
    setInput(mock);
    setVoiceTranscribing(false);
  }

  async function sendQuickMenu(menu: string) {
    if (isTyping) return;
    setMessages((prev) => [...prev, { role: "user", content: menu, createdAt: new Date().toISOString() }]);
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsTyping(false);
    pushAssistant(quickMenuReply(menu));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-[30vh] shrink-0">
        <SpeakingCharacter
          imageSrc={withBasePath("/images/secretary_misaki.png")}
          isSpeaking={isSpeaking}
          viseme={viseme}
          className="h-full w-full rounded-b-[28px]"
          // このページのコンテナは横長（30vh高×フル幅）で元画像（正方形）を縦方向に
          // クロップして表示するため、SpeakingCharacterのデフォルト口位置
          // （クロップなしの正方形表示・/dev-character用に校正した値）とはズレる。
          // クロップ後の見え方に合わせて再校正した値をここで渡す。
          mouth={{ top: "54%", left: "49%", width: "11%", height: "5%" }}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-[28px] bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">{secretaryName}</span>
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1 rounded-chip bg-white/25 px-2 py-0.5 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                AI秘書
              </span>
            ) : (
              <span
                className="flex items-center gap-1 rounded-chip bg-white/25 px-2 py-0.5 text-xs font-semibold text-white"
                title="Claude APIが未設定のため、キーワードによる簡易応答で動作しています"
              >
                <WifiOff size={11} />
                簡易応答モード
              </span>
            )}
          </div>
          <button
            aria-label="音声読み上げの切り替え"
            onClick={() => setVoiceEnabled((v) => !v)}
            className="rounded-full bg-white/25 p-2 text-white"
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs text-text-secondary">
          <Bot size={13} className="shrink-0" />
          <span>これはAIとの会話です。緊急のご用件は直接お電話等でご連絡ください。</span>
        </div>
        <div className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const next = messages[i + 1];
            // 直後のメッセージが同じ話者・同じ分（HH:MM）なら、時刻表示は
            // まとめて最後の1個だけに出す（毎回出すと視覚的なノイズになるため）。
            const showTime = !next || next.role !== m.role || formatTime(next.createdAt) !== formatTime(m.createdAt);
            return (
              <div
                key={i}
                className={`flex animate-message-in flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-md bg-brand-green text-white"
                      : "rounded-2xl rounded-bl-md bg-white text-text-primary shadow-card"
                  }`}
                >
                  {m.content}
                </div>
                {showTime && (
                  <span className="mb-1 mt-0.5 text-[11px] text-text-secondary">{formatTime(m.createdAt)}</span>
                )}

                {m.pendingCheckins && m.pendingCheckins.length > 0 && (
                  <div className="mt-1 flex w-full max-w-[85%] flex-col gap-2">
                    {m.pendingCheckins.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-card border border-warning/40 bg-white p-3 text-sm shadow-card"
                      >
                        <span className="min-w-0 flex-1 truncate">{t.title}</span>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => respondToCheckin(i, t, true)}
                            aria-label="完了しました"
                            className="flex items-center gap-1 rounded-chip bg-brand-green px-3 py-1.5 font-semibold text-white"
                          >
                            <Check size={16} />
                            完了
                          </button>
                          <button
                            onClick={() => respondToCheckin(i, t, false)}
                            aria-label="まだです"
                            className="flex items-center gap-1 rounded-chip border border-neutral-gray px-3 py-1.5 font-semibold text-text-secondary"
                          >
                            <X size={16} />
                            まだ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {m.pendingContactReminders && m.pendingContactReminders.length > 0 && (
                  <div className="mt-1 flex w-full max-w-[85%] flex-col gap-2">
                    {m.pendingContactReminders.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-card border border-primary-blue/40 bg-white p-3 text-sm shadow-card"
                      >
                        <span className="min-w-0 flex-1 truncate">{p.name}さん</span>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => respondToContactReminder(i, p, true)}
                            aria-label="連絡しました"
                            className="flex items-center gap-1 rounded-chip bg-primary-blue px-3 py-1.5 font-semibold text-white"
                          >
                            <Phone size={14} />
                            連絡した
                          </button>
                          <button
                            onClick={() => respondToContactReminder(i, p, false)}
                            aria-label="あとで連絡します"
                            className="flex items-center gap-1 rounded-chip border border-neutral-gray px-3 py-1.5 font-semibold text-text-secondary"
                          >
                            <X size={16} />
                            あとで
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {isTyping && (
            <div className="flex animate-message-in items-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-card">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-neutral-gray px-4 py-2">
        {quickMenuItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => sendQuickMenu(label)}
            disabled={isTyping}
            className="flex shrink-0 items-center gap-1.5 rounded-chip border border-brand-green px-3 py-1.5 text-sm font-semibold text-brand-green disabled:opacity-40"
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t border-neutral-gray px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          sendUser(input);
        }}
      >
        <button
          type="button"
          aria-label={voiceRecording ? "録音を停止" : "音声入力"}
          onClick={toggleVoiceInput}
          disabled={voiceTranscribing}
          className={`relative flex h-tap-target w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
            voiceRecording ? "bg-error text-white" : "text-brand-green"
          }`}
        >
          {voiceRecording && <span className="absolute inset-0 animate-ping rounded-full bg-error/60" />}
          {voiceTranscribing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Mic size={22} className="relative" />
          )}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={voiceRecording || voiceTranscribing}
          placeholder={
            voiceRecording ? "話してください…（もう一度マイクをタップで終了）" : voiceTranscribing ? "文字に変換しています…" : "メッセージを入力"
          }
          className="h-tap-target flex-1 rounded-input bg-neutral-gray px-4 text-base outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="送信"
          className="flex h-tap-target w-10 shrink-0 items-center justify-center text-brand-green"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
}
