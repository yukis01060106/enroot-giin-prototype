"use client";

import Image from "next/image";
import type { Viseme } from "@/lib/useSpeakingCharacter";

export interface MouthRect {
  top: string;
  left: string;
  width: string;
  height: string;
}

/**
 * secretary_misaki.png（1024x1024）の顔位置から目視で概算した口の位置。
 * 正確な座標ではないので、実機で確認しながら微調整してよい値として
 * propsで上書き可能にしてある。
 */
const defaultMouth: MouthRect = { top: "37%", left: "49%", width: "11%", height: "3%" };

export interface SpeakingCharacterProps {
  imageSrc: string;
  isSpeaking: boolean;
  viseme: Viseme;
  alt?: string;
  className?: string;
  mouth?: MouthRect;
}

/**
 * 1枚の人物写真をベースにしたリップシンクキャラクター表示。
 *
 * 口パクは実写の口画像を切り替える方式ではなく、口の位置に半透明の
 * 楕円を重ねて開閉させるCSS方式（画像素材が存在しないため）。
 * 将来MuseTalk等の本格的なAIリップシンクに差し替える際は、この
 * コンポーネントのprops契約（isSpeaking / viseme相当の入力を受けて
 * 見た目を変える）を保ったまま中身だけ差し替えられるようにしてある。
 */
export function SpeakingCharacter({
  imageSrc,
  isSpeaking,
  viseme,
  alt = "AI秘書",
  className = "",
  mouth = defaultMouth,
}: SpeakingCharacterProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={imageSrc} alt={alt} fill className="object-cover" priority />
      <div
        aria-hidden
        className="absolute rounded-[50%] bg-[#7a3b3b] transition-all duration-150 ease-out"
        style={{
          top: mouth.top,
          left: mouth.left,
          width: mouth.width,
          height: mouth.height,
          opacity: isSpeaking ? (viseme === "open" ? 0.55 : 0.22) : 0,
          transform: `translate(-50%, -50%) scaleY(${viseme === "open" ? 1.7 : 0.6})`,
        }}
      />
    </div>
  );
}
