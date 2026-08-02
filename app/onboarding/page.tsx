"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { SecretaryAvatar } from "@/components/SecretaryAvatar";
import { useAppStore } from "@/store/appStore";
import { classify } from "@/lib/aiClassificationService";
import type { ChatMessageModel } from "@/types/models";

type Step = "greeting" | "honorific" | "recordPrompt" | "recordInput" | "done";

/** v5.1: オンボーディングはAI秘書「藤堂美咲」がチャット形式で案内する。onboarding_view.dart の移植。 */
export default function OnboardingPage() {
  const router = useRouter();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const addRecord = useAppStore((s) => s.addRecord);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [messages, setMessages] = useState<ChatMessageModel[]>([
    {
      role: "assistant",
      content:
        "はじめまして、藤堂美咲と申します。\nこれから議員としての活動のサポートをさせていただきますね。\nまずはお名前を教えていただけますか？",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [step, setStep] = useState<Step>("greeting");
  const [input, setInput] = useState("");
  const displayNameRef = useRef("");
  const honorificRef = useRef("先生");

  function addAssistant(content: string) {
    setMessages((prev) => [...prev, { role: "assistant", content, createdAt: new Date().toISOString() }]);
  }
  function addUser(content: string) {
    setMessages((prev) => [...prev, { role: "user", content, createdAt: new Date().toISOString() }]);
  }

  function submitName(text: string) {
    const name = text.trim();
    if (!name) return;
    addUser(name);
    displayNameRef.current = name;
    addAssistant(`${name}様ですね、よろしくお願いします。\nお呼びする際の敬称を選んでいただけますか？`);
    setStep("honorific");
    setInput("");
  }

  function submitHonorific(honorific: string) {
    honorificRef.current = honorific;
    addUser(honorific);
    addAssistant(
      `ありがとうございます。これからは${displayNameRef.current}${honorific}とお呼びしますね。\n` +
        "早速ですが、1つ試していただいてもいいですか？\n今日あったことを、何でも書いてみてください。"
    );
    setStep("recordPrompt");
    updateProfile((p) => ({ ...p, displayName: displayNameRef.current, honorific }));
  }

  function submitRecord(text: string) {
    const content = text.trim();
    if (!content) return;
    const result = classify(content);
    addRecord({ content, categories: result.categories, aiConfidence: result.confidence });
    addUser(content);
    addAssistant(
      "素晴らしいです！これで最初の記録が保存されました。\n私がちゃんと整理しておきますね。\n" +
        "これからは毎朝、今日の予定やToDoをお知らせします。\n何かあればいつでも話しかけてくださいね。"
    );
    setStep("done");
    setInput("");
  }

  function finish() {
    completeOnboarding();
    router.replace("/");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-center gap-1 py-4">
        <SecretaryAvatar size={80} />
        <p className="font-bold">藤堂 美咲</p>
      </div>
      <hr className="border-neutral-gray" />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[280px] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 ${
                  m.role === "user" ? "bg-brand-green text-white" : "bg-white text-text-primary"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        {step === "greeting" && (
          <TextInputRow value={input} onChange={setInput} placeholder="お名前を入力" onSubmit={submitName} />
        )}
        {step === "honorific" && (
          <div className="flex gap-3">
            <button
              onClick={() => submitHonorific("先生")}
              className="h-tap-target flex-1 rounded-input border border-primary-blue font-semibold text-primary-blue"
            >
              先生
            </button>
            <button
              onClick={() => submitHonorific("さん")}
              className="h-tap-target flex-1 rounded-input border border-primary-blue font-semibold text-primary-blue"
            >
              さん
            </button>
          </div>
        )}
        {step === "recordPrompt" && (
          <button onClick={() => setStep("recordInput")} className="h-tap-target w-full rounded-input bg-brand-green font-bold text-white">
            話してみる
          </button>
        )}
        {step === "recordInput" && (
          <TextInputRow
            value={input}
            onChange={setInput}
            placeholder="今日あったことを書いてください"
            onSubmit={submitRecord}
            multiline
          />
        )}
        {step === "done" && (
          <button onClick={finish} className="h-tap-target w-full rounded-input bg-brand-green font-bold text-white">
            はじめる
          </button>
        )}
      </div>
    </div>
  );
}

function TextInputRow({
  value,
  onChange,
  placeholder,
  onSubmit,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex-1 rounded-sheet bg-white px-4 py-3 outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && onSubmit(value)}
          className="h-tap-target flex-1 rounded-sheet bg-white px-4 outline-none"
        />
      )}
      <button
        onClick={() => onSubmit(value)}
        aria-label="送信"
        className="flex h-tap-target w-10 shrink-0 items-center justify-center text-brand-green"
      >
        <Send size={22} />
      </button>
    </div>
  );
}
