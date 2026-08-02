import type { LucideIcon } from "lucide-react";

/** アプリ全体で統一された空状態の表示。empty_state.dart の移植。 */
export function EmptyState({
  icon: Icon,
  message,
  actionHint,
}: {
  icon: LucideIcon;
  message: string;
  actionHint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-blue/6">
        <Icon size={30} className="text-text-secondary" />
      </span>
      <p className="text-text-secondary leading-relaxed">{message}</p>
      {actionHint && <p className="text-sm font-semibold text-brand-green">{actionHint}</p>}
    </div>
  );
}
