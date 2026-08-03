"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, Volume2, VolumeX, Check, X, Loader2, Calendar, ListTodo, IdCard } from "lucide-react";
import { SpeakingCharacter } from "@/components/character/SpeakingCharacter";
import { useSpeakingCharacter } from "@/lib/useSpeakingCharacter";
import { greeting, quickMenuReply, freeformReply, overdueTodoCheckinMessage } from "@/lib/secretaryService";
import { useAppStore } from "@/store/appStore";
import { withBasePath } from "@/lib/basePath";
import type { ChatMessageModel } from "@/types/models";

const quickMenuItems = [
  { label: "今日の予定", icon: Calendar },
  { label: "ToDo", icon: ListTodo },
  { label: "名刺管理", icon: IdCard },
];
const secretaryName = "藤堂 美咲";
const mockChatTranscripts = [
  "今日の予定を教えて",
  "田中さんに連絡するのを忘れないようにしたい",
  "一般質問の準備について相談したい",
];

/** チャットメッセージに、そのメッセージ発端のToDo確認チップを紐付けて保持する
 * （chipsをメッセージ一覧の末尾に別枠で表示すると、後から続く会話の下に
 * 取り残されて何に対する確認か分からなくなるため、発端のメッセージ直下に
 * 固定表示する）。 */
type PendingCheckin = { id: string; title: string };
type LocalMessage = ChatMessageModel & { pendingCheckins?: PendingCheckin[] };

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SecretaryPage() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // 一旦デフォルトOFF（Google Cloud TTS未設定の環境ではブラウザ標準TTSの
  // 機械的な声が毎回自動再生されてしまうため）。スピーカーアイコンで手動ON可能。
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const greeted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, viseme, speak } = useSpeakingCharacter();
  const toggleTodo = useAppStore((s) => s.toggleTodo);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const text = greeting();
    setMessages([{ role: "assistant", content: text, createdAt: new Date().toISOString() }]);
    if (voiceEnabled) speak(text);

    // 期限切れのToDoがあれば、こちらから聞かれる前に美咲から確認してもらう。
    // 確認チップはこのメッセージ自身にpendingCheckinsとして紐付けておき、後で
    // どれだけ会話が続いても常にこの発言の直下に表示されるようにする
    // （会話末尾に別枠で出すと、後続の会話に埋もれて何の確認か分からなくなるため）。
    const overdue = useAppStore.getState().overdueTodos();
    if (overdue.length > 0) {
      window.setTimeout(() => {
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
      }, 1000);
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

  function respondToCheckin(messageIndex: number, todo: PendingCheckin, done: boolean) {
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
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-[28px] bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">{secretaryName}</span>
            <span className="rounded-chip bg-white/25 px-2 py-0.5 text-xs font-semibold text-white">
              AI秘書
            </span>
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
        <div className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const next = messages[i + 1];
            // 直後のメッセージが同じ話者・同じ分（HH:MM）なら、時刻表示は
            // まとめて最後の1個だけに出す（毎回出すと視覚的なノイズになるため）。
            const showTime = !next || next.role !== m.role || formatTime(next.createdAt) !== formatTime(m.createdAt);
            return (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
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
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-start">
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
