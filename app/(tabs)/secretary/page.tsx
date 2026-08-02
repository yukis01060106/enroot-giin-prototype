"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, Volume2, VolumeX } from "lucide-react";
import { SpeakingCharacter } from "@/components/character/SpeakingCharacter";
import { useSpeakingCharacter } from "@/lib/useSpeakingCharacter";
import { greeting, quickMenuReply, freeformReply } from "@/lib/secretaryService";
import type { ChatMessageModel } from "@/types/models";
import { showNotReady } from "@/lib/notReady";

const quickMenuItems = ["今日の予定", "ToDo", "名刺管理"];
const secretaryName = "藤堂 美咲";

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SecretaryPage() {
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const greeted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, viseme, speak } = useSpeakingCharacter();

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const text = greeting();
    setMessages([{ role: "assistant", content: text, createdAt: new Date().toISOString() }]);
    if (voiceEnabled) speak(text);
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
      <div className="relative h-[38vh] shrink-0">
        <SpeakingCharacter
          imageSrc="/images/secretary_misaki.png"
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
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[280px] whitespace-pre-wrap rounded-card px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-brand-green text-white" : "bg-white text-text-primary shadow-card"
                }`}
              >
                {m.content}
              </div>
              <span className="mt-0.5 text-[11px] text-text-secondary">{formatTime(m.createdAt)}</span>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start">
              <div className="rounded-card bg-white px-4 py-3 text-sm text-text-secondary shadow-card">
                ・・・
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-neutral-gray px-4 py-2">
        {quickMenuItems.map((menu) => (
          <button
            key={menu}
            onClick={() => sendQuickMenu(menu)}
            className="shrink-0 rounded-chip border border-brand-green px-3 py-1.5 text-sm font-semibold text-brand-green"
          >
            {menu}
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
          aria-label="音声入力"
          onClick={() => showNotReady("音声入力")}
          className="flex h-tap-target w-10 shrink-0 items-center justify-center text-brand-green"
        >
          <Mic size={22} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力"
          className="h-tap-target flex-1 rounded-input bg-neutral-gray px-4 text-base outline-none focus:ring-2 focus:ring-brand-green"
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
