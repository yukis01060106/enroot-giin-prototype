import { SecretaryAvatar } from "@/components/SecretaryAvatar";

/** 議会準備等の作業画面で使う、藤堂美咲のインラインコメント吹き出し。secretary_tip_bubble.dart の移植。 */
export function SecretaryTipBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <SecretaryAvatar size={36} />
      <div className="flex-1 rounded-2xl bg-white px-3.5 py-2.5 text-sm">{text}</div>
    </div>
  );
}
