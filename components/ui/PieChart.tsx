import { formatYen } from "@/lib/currencyFormat";

/** 外部チャートライブラリに頼らない軽量な円グラフ。simple_pie_chart.dart の移植（SVG版）。 */
const palette = ["#2E7D32", "#1565C0", "#66BB6A", "#F57C00", "#7E57C2", "#546E7A"];

export function PieChart({ data, size = 120 }: { data: Record<string, number>; size?: number }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center text-sm text-text-secondary">
        データなし
      </div>
    );
  }

  const radius = size / 2;
  let cumulative = 0;
  const slices = entries.map(([key, value], i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path =
      value === total
        ? `M ${radius} 0 A ${radius} ${radius} 0 1 1 ${radius - 0.01} 0 Z`
        : `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path key={key} d={path} fill={palette[i % palette.length]} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
    </svg>
  );
}

export function PieChartLegend({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  return (
    <div className="flex flex-col gap-1">
      {entries.map(([key, value], i) => (
        <div key={key} className="flex items-center gap-1.5 text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: palette[i % palette.length] }}
          />
          <span className="truncate">
            {key} {formatYen(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
