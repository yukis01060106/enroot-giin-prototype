export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <h2 className="px-1 pb-2.5 pt-5 text-lg font-bold">{title}</h2>
      <div className="divide-y divide-neutral-gray rounded-card bg-white shadow-card">{children}</div>
    </div>
  );
}

export function SettingsRow({
  title,
  subtitle,
  trailing,
  onClick,
  danger = false,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-3.5 text-left ${
        onClick ? "" : ""
      }`}
    >
      <span className="min-w-0">
        <p className={danger ? "text-error" : ""}>{title}</p>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </span>
      {trailing}
    </Comp>
  );
}
