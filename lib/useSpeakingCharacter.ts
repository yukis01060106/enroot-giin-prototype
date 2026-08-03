"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/ttsService";

export type Viseme = "closed" | "open";

const AMPLITUDE_OPEN_THRESHOLD = 24;

/**
 * リップシンク用の口の開閉状態を管理するフック。2段構え:
 *
 * 1. Google Cloud TTS（Neural2、Supabase Edge Function経由）が使える場合
 *    → 本物の音声を再生し、Web Audio APIのAnalyserNodeで実際の音量を
 *      取得して口を開閉する（本物の音量連動リップシンク）
 * 2. Supabase未設定・Edge Function未デプロイ・APIキー未設定等で失敗した場合
 *    → ブラウザ内蔵TTS（Web Speech API）にフォールバック。ただし
 *      SpeechSynthesisUtteranceには音量を取得する手段がないため、
 *      単語境界イベント（onboundary）ベースか、それも取れない環境では
 *      一定間隔のパルスで疑似的に口を動かす
 *
 * どちらの経路でも、呼び出し側（SpeakingCharacter）はisSpeaking/visemeを
 * 受け取るだけで済むように設計してあるため、将来さらに高品質なリップシンクに
 * 差し替える場合もこのフックの中身だけを差し替えればよい。
 */
export function useSpeakingCharacter() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viseme, setViseme] = useState<Viseme>("closed");
  // ルートのHydrationGateがハイドレーション完了まで何も描画しないため、
  // このフックが実際にレンダーされる時点では既にクライアント確定
  // （windowは常に存在する）。そのままレンダー中に評価してよい。
  const supported = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);
  const fallbackTimerRef = useRef<number | null>(null);
  const boundaryFiredRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (supported) window.speechSynthesis.cancel();
    clearFallbackTimer();
    clearRaf();
    setIsSpeaking(false);
    setViseme("closed");
  }, [supported, clearFallbackTimer, clearRaf]);

  const speakWithBrowserTts = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      const jaVoice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("ja"));
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

  const speakWithGeneratedAudio = useCallback(
    (dataUrl: string) => {
      const AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return false;
      }

      const audio = new Audio(dataUrl);
      audioRef.current = audio;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextCtor();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === "suspended") void audioCtx.resume();

      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setViseme(avg > AMPLITUDE_OPEN_THRESHOLD ? "open" : "closed");
        rafRef.current = window.requestAnimationFrame(tick);
      };

      const finish = () => {
        clearRaf();
        setIsSpeaking(false);
        setViseme("closed");
        audioRef.current = null;
      };
      audio.onended = finish;
      audio.onerror = finish;

      setIsSpeaking(true);
      audio
        .play()
        .then(() => {
          rafRef.current = window.requestAnimationFrame(tick);
        })
        .catch(() => finish());

      return true;
    },
    [clearRaf]
  );

  const speak = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      synthesizeSpeech(text)
        .then((dataUrl) => {
          if (!speakWithGeneratedAudio(dataUrl)) speakWithBrowserTts(text);
        })
        .catch(() => speakWithBrowserTts(text));
    },
    [speakWithGeneratedAudio, speakWithBrowserTts]
  );

  // ブラウザによってはgetVoices()が非同期にしか埋まらないため、
  // 一度でも呼んでおくとvoiceschanged後の初回speak()で日本語音声を拾いやすくなる
  // （Google Cloud TTSが失敗した場合のフォールバック用）。
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices();
  }, [supported]);

  useEffect(() => stop, [stop]);

  return { isSpeaking, viseme, speak, stop, supported };
}
