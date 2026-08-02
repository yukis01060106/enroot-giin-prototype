"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Loader2 } from "lucide-react";
import { SuspenseBoundary } from "@/components/SuspenseBoundary";
import { useAppStore } from "@/store/appStore";
import { classify } from "@/lib/aiClassificationService";
import { recordCategoryLabels, type RecordCategory } from "@/types/models";
import { showToast } from "@/lib/notReady";

const mockTranscripts = [
  "本町一丁目の道路に陥没があるとの相談を受けた。道路課に連絡が必要。",
  "来週の一般質問で、子育て支援の拡充について取り上げたい。",
  "商工会議所の懇談会で、青年部の佐藤さんと名刺交換した。",
];

const allCategories: RecordCategory[] = ["consultation", "person", "question", "expense", "todo", "schedule"];

type Step = "voice" | "text" | "classification";

function RecordFlowInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addRecord = useAppStore((s) => s.addRecord);

  const [step, setStep] = useState<Step>(searchParams.get("mode") === "voice" ? "voice" : "text");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<Set<RecordCategory>>(new Set());
  const [confidence, setConfidence] = useState<number | undefined>(undefined);

  function proceedToClassification(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const result = classify(trimmed);
    setContent(trimmed);
    setSelected(new Set(result.categories));
    setConfidence(result.confidence);
    setStep("classification");
  }

  function save() {
    if (selected.size === 0) return;
    addRecord({ content, categories: [...selected], aiConfidence: confidence });
    router.push("/");
    showToast("できました！記録を保存しました。");
  }

  const title = step === "voice" ? "おしてはなす" : step === "text" ? "文字で入力" : "分類を確認";

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-primary-blue px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </header>

      {step === "voice" && <VoiceStep onTranscribed={(text) => { setStep("text"); setContent(text); }} />}
      {step === "text" && <TextStep initial={content} onNext={proceedToClassification} />}
      {step === "classification" && (
        <ClassificationStep
          content={content}
          selected={selected}
          onToggle={(cat) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(cat)) next.delete(cat);
              else next.add(cat);
              return next;
            })
          }
          onSave={save}
        />
      )}
    </div>
  );
}

function VoiceStep({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function start() {
    setRecording(true);
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function stop() {
    if (!recording) return;
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTranscribing(true);
    await new Promise((r) => setTimeout(r, 1200));
    const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    onTranscribed(transcript);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      {transcribing ? (
        <>
          <Loader2 size={32} className="animate-spin text-brand-green" />
          <p className="text-lg font-bold">文字に変換しています…</p>
        </>
      ) : (
        <>
          <p className="text-lg text-text-secondary">
            {recording ? "話してください" : "ボタンを押しながら話してください"}
          </p>
          <button
            onMouseDown={start}
            onMouseUp={stop}
            onTouchStart={start}
            onTouchEnd={stop}
            className={`flex h-32 w-32 items-center justify-center rounded-full transition-transform ${
              recording ? "scale-110 bg-error" : "bg-brand-green"
            }`}
          >
            <Mic size={56} className="text-white" />
          </button>
          <p className="text-text-secondary">{recording ? `録音中… ${elapsed}秒` : "長押しで録音開始"}</p>
        </>
      )}
    </div>
  );
}

function TextStep({ initial, onNext }: { initial: string; onNext: (text: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <div className="flex flex-1 flex-col p-4">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="今日あったことを書いてください"
        className="w-full flex-1 rounded-input border border-neutral-gray bg-white p-3 text-base outline-none focus:ring-2 focus:ring-brand-green"
      />
      <button
        onClick={() => onNext(text)}
        disabled={!text.trim()}
        className="mt-4 h-tap-target rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
      >
        次へ
      </button>
    </div>
  );
}

function ClassificationStep({
  content,
  selected,
  onToggle,
  onSave,
}: {
  content: string;
  selected: Set<RecordCategory>;
  onToggle: (cat: RecordCategory) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="rounded-card bg-white p-3 shadow-card">{content}</div>
      <p className="mb-3 mt-4 font-bold">AIが提案するカテゴリ（タップで変更できます）</p>
      <div className="grid grid-cols-2 gap-3">
        {allCategories.map((cat) => {
          const isSelected = selected.has(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={`rounded-input border-2 py-4 text-center font-bold ${
                isSelected ? "border-brand-green bg-brand-green text-white" : "border-text-secondary bg-white text-text-primary"
              }`}
            >
              {recordCategoryLabels[cat]}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <button
        onClick={onSave}
        disabled={selected.size === 0}
        className="mt-4 h-tap-target rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
      >
        この内容で保存する
      </button>
    </div>
  );
}

export default function RecordPage() {
  return (
    <SuspenseBoundary>
      <RecordFlowInner />
    </SuspenseBoundary>
  );
}
