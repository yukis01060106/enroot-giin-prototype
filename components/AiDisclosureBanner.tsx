import { Bot } from "lucide-react";

/**
 * AIが生成した文章を表示する画面すべてで使う共通の開示バナー。
 * 個別画面ごとに文言がバラバラだと開示として弱くなるため、
 * 標準文言を1箇所にまとめて使い回す（contextで画面固有の補足のみ追加できる）。
 */
export function AiDisclosureBanner({ context, className = "" }: { context?: string; className?: string }) {
  return (
    <div
      className={`flex items-start gap-1.5 rounded-input bg-neutral-gray px-3 py-2 text-xs leading-relaxed text-text-secondary ${className}`}
    >
      <Bot size={13} className="mt-0.5 shrink-0" />
      <span>
        これはAIの生成です。最終判断はご自身でご確認ください。{context}
      </span>
    </div>
  );
}
