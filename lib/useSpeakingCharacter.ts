"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Viseme = "closed" | "open";

/**
 * ブラウザ内蔵TTS（Web Speech API）で読み上げつつ、リップシンク用の口の
 * 開閉状態を管理するフック。
 *
 * 重要な制約: SpeechSynthesisUtteranceには実際の音声波形・振幅を取得する手段が
 * ない（onboundaryで単語/文字の区切りは分かるが音量は分からない）。そのため
 * 「音量に連動した」リップシンクは実装できず、ここでは以下の2段構えにする:
 *   1. onboundaryが発火するブラウザ（Chrome等）→ 単語境界ごとに口を開閉
 *   2. onboundaryが一定時間発火しないブラウザ（iOS Safari等で頻出）
 *      → 発話中は一定間隔で口を開閉させるフォールバックパルスに切り替える
 * どちらの場合も「本物の音量連動」ではなく疑似的な動きだが、デモとしては
 * 自然に見える。将来MuseTalk等の実音声駆動リップシンクに差し替える場合は、
 * このフックを差し替えるだけでSpeakingCharacter側は変更不要な設計にしてある。
 */
export function useSpeakingCharacter() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viseme, setViseme] = useState<Viseme>("closed");
  // false固定で初期化し、マウント後のuseEffectでのみ更新する。
  // `typeof window !== 'undefined'` をレンダー中に直接評価すると、
  // ビルド時のサーバープリレンダー（windowなし）と実ブラウザでの
  // ハイドレーション時（windowあり）で結果が食い違い、
  // Reactのハイドレーションエラー（#418）になる。
  const [supported, setSupported] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const boundaryFiredRef = useRef(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    clearFallbackTimer();
    setIsSpeaking(false);
    setViseme("closed");
  }, [supported, clearFallbackTimer]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      const jaVoice = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.startsWith("ja"));
      if (jaVoice) utterance.voice = jaVoice;

      boundaryFiredRef.current = false;
      setIsSpeaking(true);

      utterance.onboundary = () => {
        boundaryFiredRef.current = true;
        setViseme((v) => (v === "open" ? "closed" : "open"));
      };

      utterance.onstart = () => {
        window.setTimeout(() => {
          if (!boundaryFiredRef.current) {
            fallbackTimerRef.current = window.setInterval(() => {
              setViseme((v) => (v === "open" ? "closed" : "open"));
            }, 180);
          }
        }, 400);
      };

      const finish = () => {
        clearFallbackTimer();
        setIsSpeaking(false);
        setViseme("closed");
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    },
    [supported, clearFallbackTimer]
  );

  // ブラウザによってはgetVoices()が非同期にしか埋まらないため、
  // 一度でも呼んでおくとvoiceschanged後の初回speak()で日本語音声を拾いやすくなる。
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices();
  }, [supported]);

  useEffect(() => stop, [stop]);

  return { isSpeaking, viseme, speak, stop, supported };
}
