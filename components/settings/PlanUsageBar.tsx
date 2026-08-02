export function PlanUsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const ratio = limit === 0 ? 0 : Math.min(Math.max(used / limit, 0), 1);
  return (
    <div className="px-4 py-2">
      <p>
        {label} {used}/{limit}件
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-gray">
        <div
          className={`h-full rounded-full ${ratio >= 1 ? "bg-error" : "bg-brand-green"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
