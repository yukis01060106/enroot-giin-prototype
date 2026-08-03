"use client";

import { useState } from "react";
import Link from "next/link";
import { SpeakingCharacter } from "@/components/character/SpeakingCharacter";
import { useSpeakingCharacter, type Viseme } from "@/lib/useSpeakingCharacter";
import { withBasePath } from "@/lib/basePath";

/**
 * Phase 2a単体動作確認用ページ。チャット/バックエンドに一切依存せず、
 * ローカルテキスト＋ブラウザTTSだけでキャラクターの口パクを確認できる。
 *
 * 開発者向けデバッグツールであり、アプリのデザインシステム（ヘッダー・
 * ボトムナビ等）にも従っていないため、本番ビルドでは公開しない
 * （`npm run dev` のローカル開発時のみ表示する）。
 */
export default function DevCharacterPage() {
  const { isSpeaking, viseme, speak, stop, supported } = useSpeakingCharacter();
  const [manualViseme, setManualViseme] = useState<Viseme>("closed");
  const [manualMode, setManualMode] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-text-secondary">このページはご利用いただけません。</p>
        <Link href="/" className="font-semibold text-primary-blue">
          ホームへ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <h1 className="text-lg font-bold">Phase 2a: キャラクター単体確認</h1>
      <SpeakingCharacter
        imageSrc={withBasePath("/images/secretary_misaki.png")}
        isSpeaking={manualMode ? true : isSpeaking}
        viseme={manualMode ? manualViseme : viseme}
        className="h-80 w-80 rounded-card shadow-card"
      />
      <p className="text-sm text-text-secondary">
        TTS対応: {supported ? "あり" : "なし"} / isSpeaking: {String(isSpeaking)} / viseme: {viseme}
      </p>
      <button
        className="h-tap-target rounded-input bg-primary-blue px-6 font-bold text-white"
        onClick={() => speak("おはようございます、山田太郎先生。今日はご予定が3件、やることが2件入っていますよ。")}
      >
        読み上げる
      </button>
      <button className="h-tap-target rounded-input bg-neutral-gray px-6 font-bold" onClick={stop}>
        止める
      </button>
      <div className="mt-4 flex flex-col items-center gap-2 border-t pt-4">
        <p className="text-sm text-text-secondary">
          TTS非対応/無音環境（ヘッドレスブラウザ等）でも見た目を確認できる手動トグル
        </p>
        <button
          className="h-tap-target rounded-input bg-brand-green px-6 font-bold text-white"
          onClick={() => {
            setManualMode(true);
            setManualViseme((v) => (v === "open" ? "closed" : "open"));
          }}
        >
          手動で口を切り替える（{manualViseme}）
        </button>
      </div>
    </main>
  );
}
