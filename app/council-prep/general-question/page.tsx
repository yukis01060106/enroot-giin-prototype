"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WizardShell } from "@/components/gikai/WizardShell";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import * as gikai from "@/lib/gikaiDraftMockService";
import type { GikaiAnswerSimulation } from "@/lib/gikaiDraftMockService";

const stepTitles = ["テーマ・ゴール設定", "情報収集", "構成提案", "草案生成", "想定答弁・再質問", "通告書出力"];
const secretaryTips = [
  "最近のメモから、質問テーマの候補を出しますね。気になるものがあれば選んでください。",
  "テーマが決まりましたね。関連情報を集めます。少々お待ちください。",
  "素材が揃いました。質問の構成案を作りますね。",
  "構成に沿って草案を書きます。文章はあとから編集できますよ。",
  "行政側の答弁を予測して、再質問を準備しましょう。",
  "原稿が完成しました！通告書に変換しますね。",
];

function BulletCard({ title, items, footnote }: { title: string; items: string[]; footnote?: string }) {
  return (
    <div className="rounded-card bg-white p-4 shadow-card">
      <p className="font-bold">{title}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span>・</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {footnote && <p className="mt-2 text-xs text-text-secondary">{footnote}</p>}
    </div>
  );
}

export default function GeneralQuestionPage() {
  const router = useRouter();
  const records = useAppStore((s) => s.records);
  const addTodo = useAppStore((s) => s.addTodo);

  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [structure, setStructure] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<GikaiAnswerSimulation[]>([]);
  const [openAnswerIndex, setOpenAnswerIndex] = useState<number | null>(null);

  const canAdvance = step === 0 ? theme.trim() !== "" && goal.trim() !== "" : true;

  async function goNext() {
    if (step === stepTitles.length - 1) {
      finish();
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 650));
    if (step === 0) setMaterials(gikai.collectMaterials(theme));
    if (step === 1) setStructure(gikai.proposeStructure(theme));
    if (step === 2) setDraft(gikai.generateDraft({ theme, goal }));
    if (step === 3) setAnswers(gikai.answerSimulations());
    setProcessing(false);
    setStep((s) => s + 1);
  }

  function finish() {
    addTodo({ title: `「${theme}」の質問通告書を提出`, dueDate: new Date(Date.now() + 7 * 86400000).toISOString() });
    router.push("/council-prep");
    showToast("一般質問の準備が完了しました。通告書提出のToDoを追加しました。");
  }

  const themeCandidates = gikai.suggestThemes(records);

  return (
    <WizardShell
      title="一般質問を作る"
      stepTitles={stepTitles}
      step={step}
      processing={processing}
      tip={secretaryTips[step]}
      canAdvance={canAdvance}
      onBack={() => setStep((s) => s - 1)}
      onNext={goNext}
    >
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 font-bold">テーマ候補</p>
            <div className="flex flex-wrap gap-2">
              {themeCandidates.map((c) => (
                <button
                  key={c}
                  onClick={() => setTheme(c)}
                  className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                    theme === c ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-bold">テーマ</p>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例：子育て支援の拡充"
              className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <p className="mb-2 font-bold">ゴール（何を実現したいか）</p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例：待機児童の解消に向けた具体策の提示"
              rows={2}
              className="w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <BulletCard title="収集した情報" items={materials} footnote="収集した内容は「議会素材」として保存されました。" />
      )}

      {step === 2 && <BulletCard title="質問の構成案" items={structure} />}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={10}
            className="w-full rounded-card bg-white p-4 leading-relaxed shadow-card outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setDraft(gikai.generateDraft({ theme, goal, refinement: "concrete" }))}
              className="rounded-input border border-neutral-gray px-3 py-2 text-sm font-semibold"
            >
              もっと具体的に
            </button>
            <button
              onClick={() => setDraft(gikai.generateDraft({ theme, goal, refinement: "short" }))}
              className="rounded-input border border-neutral-gray px-3 py-2 text-sm font-semibold"
            >
              短くする
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3">
          {answers.map((a, i) => (
            <div key={i} className="rounded-card bg-white shadow-card">
              <button
                onClick={() => setOpenAnswerIndex(openAnswerIndex === i ? null : i)}
                className="w-full px-4 py-3 text-left"
              >
                {a.pattern}
              </button>
              {openAnswerIndex === i && <p className="px-4 pb-4 text-sm">再質問案：{a.rebuttal}</p>}
            </div>
          ))}
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-3">
          <div className="rounded-card bg-white p-4 shadow-card">
            <p className="font-bold">質問通告書（プレビュー）</p>
            <hr className="my-3 border-neutral-gray" />
            <p className="font-bold">件名：{theme}について</p>
            <p className="mb-1 mt-2 font-bold">質問要旨</p>
            <p className="whitespace-pre-wrap leading-relaxed">{draft}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => showToast("PDF出力は近日対応予定です（プロトタイプでは未接続の機能です）")}
              className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
            >
              PDF出力
            </button>
            <button
              onClick={() => showToast("Word出力は近日対応予定です（プロトタイプでは未接続の機能です）")}
              className="h-tap-target flex-1 rounded-input border border-neutral-gray font-semibold"
            >
              Word出力
            </button>
          </div>
        </div>
      )}
    </WizardShell>
  );
}
